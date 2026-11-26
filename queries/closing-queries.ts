import { prisma } from "@/lib/prisma";
import {
  ICashRegisterClosing,
  ICurrentShiftSummary,
  IPaginatedClosings,
} from "@/types/closing";

export async function getPastClosings(
  shopId: string,
  branchId?: string | null,
  page = 1,
  pageSize = 10
): Promise<IPaginatedClosings> {
  const where = { shopId, ...(branchId ? { branchId } : {}) };
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);

  const [total, closings] = await Promise.all([
    prisma.cashRegister.count({ where }),
    prisma.cashRegister.findMany({
      where,
      include: {
        user: {
          select: { name: true },
        },
      },
      orderBy: { closingDate: "desc" },
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
    }),
  ]);

  const items: ICashRegisterClosing[] = closings.map((r) => ({
    ...r,
    openingCash: Number(r.openingCash),
    cashSales: Number(r.cashSales),
    cashDueCollected: Number(r.cashDueCollected),
    cashOtherIncome: Number(r.cashOtherIncome),
    cashExpenses: Number(r.cashExpenses),
    cashSupplierPaid: Number(r.cashSupplierPaid),
    cashRefunds: Number(r.cashRefunds),
    expectedCash: Number(r.expectedCash),
    countedCash: Number(r.countedCash),
    difference: Number(r.difference),
  }));

  return { items, total, page: safePage, pageSize: safePageSize };
}

export async function getCurrentShiftSummary(
  shopId: string,
  branchId: string
): Promise<ICurrentShiftSummary> {
  const lastClosing = await prisma.cashRegister.findFirst({
    where: { shopId, branchId },
    orderBy: { createdAt: "desc" },
  });

  const since = lastClosing ? lastClosing.createdAt : new Date(new Date().setHours(0, 0, 0, 0));
  const openingCash = lastClosing ? Number(lastClosing.countedCash) : 0;

  // 1. Cash Sales & Invoice count since shift start
  const salesAgg = await prisma.sale.aggregate({
    where: {
      shopId,
      branchId,
      createdAt: { gte: since },
      paymentMethod: "cash",
    },
    _sum: { paidAmount: true },
    _count: { id: true },
  });

  // 2. Due collected in cash from customers
  const duePaymentAgg = await prisma.customerPayment.aggregate({
    where: {
      branchId,
      createdAt: { gte: since },
      paymentMethod: "cash",
    },
    _sum: { amount: true },
  });

  // 3. Other cash income
  const otherIncomeAgg = await prisma.otherIncome.aggregate({
    where: {
      shopId,
      branchId,
      createdAt: { gte: since },
      paymentMethod: "cash",
    },
    _sum: { amount: true },
  });

  // 4. Cash expenses
  const expenseAgg = await prisma.expense.aggregate({
    where: {
      shopId,
      branchId,
      createdAt: { gte: since },
      paymentMethod: "cash",
    },
    _sum: { amount: true },
  });

  // 5. Cash paid to suppliers
  const supplierPaymentAgg = await prisma.supplierPayment.aggregate({
    where: {
      branchId,
      createdAt: { gte: since },
      paymentMethod: "cash",
    },
    _sum: { amount: true },
  });

  // 6. Cash refunded on sale returns
  const refundAgg = await prisma.saleReturn.aggregate({
    where: {
      shopId,
      branchId,
      createdAt: { gte: since },
      refundMethod: "cash",
    },
    _sum: { totalRefund: true },
  });

  const cashSales = Number(salesAgg._sum.paidAmount || 0);
  const cashDueCollected = Number(duePaymentAgg._sum.amount || 0);
  const cashOtherIncome = Number(otherIncomeAgg._sum.amount || 0);
  const cashExpenses = Number(expenseAgg._sum.amount || 0);
  const cashSupplierPaid = Number(supplierPaymentAgg._sum.amount || 0);
  const cashRefunds = Number(refundAgg._sum.totalRefund || 0);

  const totalInflows = openingCash + cashSales + cashDueCollected + cashOtherIncome;
  const totalOutflows = cashExpenses + cashSupplierPaid + cashRefunds;
  const expectedCash = totalInflows - totalOutflows;

  return {
    lastClosingTime: lastClosing ? lastClosing.createdAt : null,
    openingCash,
    cashSales,
    cashDueCollected,
    cashOtherIncome,
    cashExpenses,
    cashSupplierPaid,
    cashRefunds,
    expectedCash,
    totalInvoices: salesAgg._count.id || 0,
  };
}