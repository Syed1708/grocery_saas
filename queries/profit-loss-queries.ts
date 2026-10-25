import { prisma } from "@/lib/prisma";
import { IProfitLossData, IProfitLossFilterParams } from "@/types/profit-loss";

export async function getProfitLossData(
  shopId: string,
  branchId: string,
  filters: IProfitLossFilterParams
): Promise<IProfitLossData> {
  const dateFilter: any = {};
  if (filters.startDate || filters.endDate) {
    if (filters.startDate) dateFilter.gte = new Date(`${filters.startDate}T00:00:00`);
    if (filters.endDate) dateFilter.lte = new Date(`${filters.endDate}T23:59:59`);
  } else {
    // Default: This Month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    dateFilter.gte = startOfMonth;
  }

  // 1. Sales & Gross Revenue
  const salesAgg = await prisma.sale.aggregate({
    where: {
      shopId,
      branchId,
      createdAt: dateFilter,
    },
    _sum: {
      subtotal: true,
      discount: true,
      grandTotal: true,
    },
  });

  // 2. Cost of Goods Sold (COGS) from SaleItems
  const saleItems = await prisma.saleItem.findMany({
    where: {
      sale: {
        shopId,
        branchId,
        createdAt: dateFilter,
      },
    },
    select: {
      quantity: true,
      purchaseCost: true,
    },
  });

  let cogsAmount = 0;
  for (const item of saleItems) {
    cogsAmount += Number(item.quantity) * Number(item.purchaseCost);
  }

  // 3. Sale Returns & Damaged Write-offs
  const saleReturns = await prisma.saleReturn.findMany({
    where: {
      shopId,
      branchId,
      createdAt: dateFilter,
    },
    include: {
      items: true,
    },
  });

  let totalReturnsAmount = 0;
  let damagedGoodsLoss = 0;
  let cogsRestockAdjustment = 0;

  for (const ret of saleReturns) {
    totalReturnsAmount += Number(ret.totalRefund);
    for (const rItem of ret.items) {
      const lineCost = Number(rItem.quantity) * Number(rItem.refundPrice);
      if (rItem.itemCondition === "DAMAGED") {
        damagedGoodsLoss += lineCost;
      } else {
        cogsRestockAdjustment += lineCost;
      }
    }
  }

  // 4. Operating Expenses by Category
  const rawExpenses = await prisma.expense.findMany({
    where: {
      shopId,
      branchId,
      createdAt: dateFilter,
    },
    include: {
      category: { select: { id: true, name: true } },
    },
  });

  let operatingExpenses = 0;
  const categoryMap = new Map<string, { name: string; amount: number }>();

  for (const exp of rawExpenses) {
    const amt = Number(exp.amount);
    operatingExpenses += amt;

    const catId = exp.categoryId;
    const catName = exp.category.name;
    const cur = categoryMap.get(catId) || { name: catName, amount: 0 };
    categoryMap.set(catId, { name: catName, amount: cur.amount + amt });
  }

  const expenseCategories = Array.from(categoryMap.entries()).map(([id, val]) => ({
    categoryId: id,
    categoryName: val.name,
    totalAmount: val.amount,
  }));

  // 5. Staff Payroll
  const payrollAgg = await prisma.payroll.aggregate({
    where: {
      shopId,
      branchId,
      salaryDate: dateFilter,
    },
    _sum: { netSalary: true },
  });

  const payrollExpenses = Number(payrollAgg._sum.netSalary || 0);

  // 6. Other Incomes
  const incomeAgg = await prisma.otherIncome.aggregate({
    where: {
      shopId,
      branchId,
      incomeDate: dateFilter,
    },
    _sum: { amount: true },
  });

  const otherIncome = Number(incomeAgg._sum.amount || 0);

  // ==========================================
  // FINAL P&L CALCULATIONS
  // ==========================================
  const grossSales = Number(salesAgg._sum.subtotal || 0);
  const salesDiscount = Number(salesAgg._sum.discount || 0);
  const netSalesRevenue = Math.max(0, grossSales - salesDiscount - totalReturnsAmount);

  const netCogs = Math.max(0, cogsAmount - cogsRestockAdjustment);
  const grossProfit = netSalesRevenue - netCogs;
  const grossMarginPercent = netSalesRevenue > 0 ? (grossProfit / netSalesRevenue) * 100 : 0;

  const totalOpex = operatingExpenses + payrollExpenses + damagedGoodsLoss;
  const netProfit = grossProfit - totalOpex + otherIncome;
  const netMarginPercent = netSalesRevenue > 0 ? (netProfit / netSalesRevenue) * 100 : 0;

  return {
    grossSales,
    salesDiscount,
    salesReturns: totalReturnsAmount,
    netSalesRevenue,
    cogsAmount,
    cogsRestockAdjustment,
    netCogs,
    grossProfit,
    grossMarginPercent: Number(grossMarginPercent.toFixed(1)),
    operatingExpenses,
    payrollExpenses,
    damagedGoodsLoss,
    totalOpex,
    expenseCategories,
    otherIncome,
    netProfit,
    netMarginPercent: Number(netMarginPercent.toFixed(1)),
  };
}