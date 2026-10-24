import { prisma } from "@/lib/prisma";

export interface IReportsOverviewStats {
  todaySalesTotal: number;
  todayInvoicesCount: number;
  todayCollectedCash: number;
  totalCustomerDue: number;
  totalSupplierDue: number;
  lowStockItemsCount: number;
  todayExpensesTotal: number;
}

export async function getReportsOverviewStats(
  shopId: string,
  branchId: string
): Promise<IReportsOverviewStats> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    todaySalesAgg,
    customerDueAgg,
    supplierDueAgg,
    todayExpenseAgg,
    lowStockCount,
  ] = await Promise.all([
    // 1. Today's Sales & Invoices
    prisma.sale.aggregate({
      where: {
        shopId,
        branchId,
        createdAt: { gte: todayStart },
      },
      _sum: { grandTotal: true, paidAmount: true },
      _count: { id: true },
    }),

    // 2. Total Outstanding Customer Dues (Bakir Khata)
    prisma.customer.aggregate({
      where: { shopId, status: "active" },
      _sum: { currentDue: true },
    }),

    // 3. Total Supplier Dues
    prisma.supplier.aggregate({
      where: { shopId, status: "active" },
      _sum: { currentDue: true },
    }),

    // 4. Today's Expenses
    prisma.expense.aggregate({
      where: {
        shopId,
        branchId,
        createdAt: { gte: todayStart },
      },
      _sum: { amount: true },
    }),

    // 5. Products below alert quantity in active branch
    prisma.productStock.count({
      where: {
        branchId,
        product: {
          shopId,
          status: "active",
        },
        quantity: { lte: 5 }, // Default threshold
      },
    }),
  ]);

  return {
    todaySalesTotal: Number(todaySalesAgg._sum.grandTotal || 0),
    todayInvoicesCount: todaySalesAgg._count.id || 0,
    todayCollectedCash: Number(todaySalesAgg._sum.paidAmount || 0),
    totalCustomerDue: Number(customerDueAgg._sum.currentDue || 0),
    totalSupplierDue: Number(supplierDueAgg._sum.currentDue || 0),
    lowStockItemsCount: lowStockCount,
    todayExpensesTotal: Number(todayExpenseAgg._sum.amount || 0),
  };
}