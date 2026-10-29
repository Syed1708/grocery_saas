import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/guard";
import { IDashboardData, ISalesTrendPoint, ICategorySalesShare } from "@/types/dashboard";

const PALETTE = ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];

export async function getDashboardData(): Promise<{ success: boolean; data?: IDashboardData; error?: string }> {
  try {
    const user = await requireAuth();
    const { shopId, activeBranchId } = user;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
    const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
    const startOf30DaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const branchFilter = activeBranchId ? { branchId: activeBranchId } : {};

    // 1. Parallel Aggregations
    const [
      todaySalesAgg,
      yesterdaySalesAgg,
      monthSalesAgg,
      customerDuesAgg,
      supplierDuesAgg,
      accountsAgg,
      recentSalesRaw,
      thirtyDaysSales,
      thirtyDaysExpenses,
      stocksRaw,
    ] = await Promise.all([
      // Today Sales
      prisma.sale.aggregate({
        where: { shopId, ...branchFilter, saleDate: { gte: startOfToday } },
        _sum: { grandTotal: true },
        _count: { id: true },
      }),
      // Yesterday Sales
      prisma.sale.aggregate({
        where: { shopId, ...branchFilter, saleDate: { gte: startOfYesterday, lte: endOfYesterday } },
        _sum: { grandTotal: true },
      }),
      // This Month Sales
      prisma.sale.aggregate({
        where: { shopId, ...branchFilter, saleDate: { gte: startOfMonth } },
        _sum: { grandTotal: true },
      }),
      // Customer Receivables (Dues)
      prisma.customer.aggregate({
        where: { shopId, ...branchFilter, status: "active" },
        _sum: { currentDue: true },
      }),
      // Supplier Payables
      prisma.supplier.aggregate({
        where: { shopId, status: "active" },
        _sum: { currentDue: true },
      }),
      // Accounts (Cash + Bank balances)
      prisma.account.aggregate({
        where: { shopId, ...branchFilter, status: "active" },
        _sum: { currentBalance: true },
      }),
      // 5 Recent Sales
      prisma.sale.findMany({
        where: { shopId, ...branchFilter },
        take: 6,
        orderBy: { createdAt: "desc" },
        include: { customer: { select: { name: true } } },
      }),
      // 30 Days Sales with items for trend & rush hours
      prisma.sale.findMany({
        where: { shopId, ...branchFilter, saleDate: { gte: startOf30DaysAgo } },
        select: {
          saleDate: true,
          grandTotal: true,
          items: {
            select: {
              quantity: true,
              purchaseCost: true,
              product: { select: { categoryId: true, category: { select: { name: true } } } },
            },
          },
        },
      }),
      // 30 Days OPEX Expenses
      prisma.expense.findMany({
        where: { shopId, ...branchFilter, expenseDate: { gte: startOf30DaysAgo } },
        select: { expenseDate: true, amount: true },
      }),
      // Product Stocks for Low Stock & Expiry warnings
      prisma.productStock.findMany({
        where: { ...(activeBranchId ? { branchId: activeBranchId } : {}), product: { shopId } },
        include: { product: true },
      }),
    ]);

    // 2. Compute KPI Deltas
    const todaySales = Number(todaySalesAgg._sum.grandTotal || 0);
    const yesterdaySales = Number(yesterdaySalesAgg._sum.grandTotal || 0);
    const todaySalesDelta = yesterdaySales > 0 
      ? Number((((todaySales - yesterdaySales) / yesterdaySales) * 100).toFixed(1))
      : 0;

    // 3. Process 30-Day Trends (Revenue vs COGS vs Expense)
    const trendMap = new Map<string, { sales: number; cost: number; expense: number }>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      trendMap.set(key, { sales: 0, cost: 0, expense: 0 });
    }

    // Accumulate Sales & COGS
    const categoryTotals = new Map<string, number>();
    const hourlyDistribution = Array.from({ length: 14 }, (_, idx) => ({
      hour: `${idx + 9 > 12 ? idx + 9 - 12 : idx + 9} ${idx + 9 >= 12 ? "PM" : "AM"}`,
      orders: 0,
      sales: 0,
    }));

    thirtyDaysSales.forEach((s) => {
      const dateKey = s.saleDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const current = trendMap.get(dateKey) || { sales: 0, cost: 0, expense: 0 };
      const saleVal = Number(s.grandTotal);
      let costVal = 0;

      s.items.forEach((item) => {
        const itemCost = Number(item.purchaseCost || 0) * Number(item.quantity || 0);
        costVal += itemCost;
        const catName = item.product?.category?.name || "General";
        categoryTotals.set(catName, (categoryTotals.get(catName) || 0) + Number(item.quantity) * Number(item.purchaseCost || 0));
      });

      trendMap.set(dateKey, {
        sales: current.sales + saleVal,
        cost: current.cost + costVal,
        expense: current.expense,
      });

      // Hourly curve
      const hour = s.saleDate.getHours();
      if (hour >= 9 && hour <= 22) {
        const hIdx = hour - 9;
        hourlyDistribution[hIdx].orders += 1;
        hourlyDistribution[hIdx].sales += saleVal;
      }
    });

    // Accumulate Expenses
    thirtyDaysExpenses.forEach((e) => {
      const dateKey = e.expenseDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const current = trendMap.get(dateKey);
      if (current) {
        current.expense += Number(e.amount);
      }
    });

    const salesTrends: ISalesTrendPoint[] = Array.from(trendMap.entries()).map(([date, val]) => ({
      date,
      sales: Math.round(val.sales),
      cost: Math.round(val.cost),
      expense: Math.round(val.expense),
      netProfit: Math.round(val.sales - val.cost - val.expense),
    }));

    // 4. Process Category Distribution (Top 5 + Others)
    const sortedCats = Array.from(categoryTotals.entries()).sort((a, b) => b[1] - a[1]);
    const totalCatRevenue = sortedCats.reduce((acc, [, val]) => acc + val, 0) || 1;
    const categoryShares: ICategorySalesShare[] = sortedCats.slice(0, 5).map(([name, val], idx) => ({
      name,
      value: Math.round(val),
      percentage: Math.round((val / totalCatRevenue) * 100),
      color: PALETTE[idx % PALETTE.length],
    }));

    // 5. Stock & Expiry Alerts
    const stockAlerts: any[] = [];
    let lowStockCount = 0;
    let expiringSoonCount = 0;

    stocksRaw.forEach((st) => {
      const currentQty = Number(st.quantity);
      const alertQty = Number(st.product.alertQuantity || 10);
      const expDate = st.product.expiryDate;

      if (currentQty <= alertQty) {
        lowStockCount++;
        if (stockAlerts.length < 5) {
          stockAlerts.push({
            id: st.productId,
            name: st.product.name,
            sku: st.product.sku,
            stock: currentQty,
            alertQuantity: alertQty,
            type: "LOW_STOCK",
          });
        }
      }

      if (expDate) {
        if (expDate < now) {
          expiringSoonCount++;
        } else if (expDate <= sevenDaysFromNow) {
          expiringSoonCount++;
          if (stockAlerts.length < 5) {
            stockAlerts.push({
              id: st.productId,
              name: st.product.name,
              sku: st.product.sku,
              stock: currentQty,
              alertQuantity: alertQty,
              type: "EXPIRING_SOON",
              expiryDate: expDate,
            });
          }
        }
      }
    });

    return {
      success: true,
      data: {
        kpis: {
          todaySales,
          todaySalesDelta,
          todayOrdersCount: todaySalesAgg._count.id,
          monthSales: Number(monthSalesAgg._sum.grandTotal || 0),
          customerDuesTotal: Number(customerDuesAgg._sum.currentDue || 0),
          supplierPayablesTotal: Number(supplierDuesAgg._sum.currentDue || 0),
          activeCashAndBank: Number(accountsAgg._sum.currentBalance || 0),
          lowStockCount,
          expiringSoonCount,
        },
        salesTrends,
        categoryShares,
        hourlyRush: hourlyDistribution,
        recentSales: recentSalesRaw.map((s) => ({
          id: s.id,
          invoiceNo: s.invoiceNo,
          customerName: s.customer?.name || "Walk-in Counter",
          grandTotal: Number(s.grandTotal),
          paidAmount: Number(s.paidAmount),
          paymentMethod: s.paymentMethod,
          paymentStatus: s.paymentStatus,
          createdAt: s.createdAt,
        })),
        stockAlerts,
      },
    };
  } catch (error: any) {
    console.error("getDashboardData error:", error);
    return { success: false, error: error.message || "Failed to load dashboard metrics." };
  }
}