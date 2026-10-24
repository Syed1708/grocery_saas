import { prisma } from "@/lib/prisma";
import {
  IExpenseCategory,
  IExpense,
  IOtherIncome,
  ICompanyAsset,
  IOwnerTransaction,
} from "@/types";

export async function getExpenseCategories(shopId: string): Promise<IExpenseCategory[]> {
  const cats = await prisma.expenseCategory.findMany({
    where: { shopId },
    include: { _count: { select: { expenses: true } } },
    orderBy: { name: "asc" },
  });

  return cats.map((c) => ({
    id: c.id,
    name: c.name,
    code: c.code,
    description: c.description,
    status: c.status,
    _count: c._count,
  }));
}

export async function getExpenses(shopId: string, branchId?: string | null): Promise<IExpense[]> {
  const expenses = await prisma.expense.findMany({
    where: { shopId, ...(branchId ? { branchId } : {}) },
    include: {
      category: { select: { name: true } },
      branch: { select: { name: true } },
    },
    orderBy: { expenseDate: "desc" },
  });

  return expenses.map((e) => ({
    id: e.id,
    voucherNo: e.voucherNo,
    expenseDate: e.expenseDate,
    amount: Number(e.amount),
    paymentMethod: e.paymentMethod,
    reference: e.reference,
    note: e.note,
    categoryName: e.category.name,
    branchName: e.branch.name,
    createdAt: e.createdAt,
  }));
}

export async function getOtherIncomes(shopId: string): Promise<IOtherIncome[]> {
  const incomes = await prisma.otherIncome.findMany({
    where: { shopId },
    orderBy: { incomeDate: "desc" },
  });

  return incomes.map((i) => ({
    id: i.id,
    incomeSource: i.incomeSource,
    receiptNo: i.receiptNo,
    incomeDate: i.incomeDate,
    amount: Number(i.amount),
    paymentMethod: i.paymentMethod,
    reference: i.reference,
    note: i.note,
    createdAt: i.createdAt,
  }));
}

export async function getCompanyAssets(shopId: string): Promise<ICompanyAsset[]> {
  const assets = await prisma.companyAsset.findMany({
    where: { shopId },
    include: { branch: { select: { name: true } } },
    orderBy: { purchaseDate: "desc" },
  });

  return assets.map((a) => ({
    id: a.id,
    name: a.name,
    assetCode: a.assetCode,
    serialNumber: a.serialNumber,
    purchaseDate: a.purchaseDate,
    purchaseCost: Number(a.purchaseCost),
    currentValue: Number(a.currentValue),
    condition: a.condition,
    notes: a.notes,
    branchName: a.branch?.name || "All Branches",
  }));
}

export async function getOwnerTransactions(shopId: string): Promise<IOwnerTransaction[]> {
  const txs = await prisma.ownerTransaction.findMany({
    where: { shopId },
    orderBy: { transactionDate: "desc" },
  });

  return txs.map((t) => ({
    id: t.id,
    type: t.type,
    transactionDate: t.transactionDate,
    amount: Number(t.amount),
    paymentMethod: t.paymentMethod,
    reference: t.reference,
    purpose: t.purpose,
    notes: t.notes,
    createdAt: t.createdAt,
  }));
}