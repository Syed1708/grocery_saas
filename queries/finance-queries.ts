import { prisma } from "@/lib/prisma";
import { 
  IExpenseCategory, 
  IExpense, 
  IOtherIncome, 
  ICompanyAsset, 
  IOwnerTransaction 
} from "@/types";

// 1. Expense Categories
export async function getExpenseCategories(shopId: string): Promise<IExpenseCategory[]> {
  const categories = await prisma.expenseCategory.findMany({
    where: { shopId, status: "active" },
    include: {
      _count: { select: { expenses: true } },
    },
    orderBy: { name: "asc" },
  });

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    code: c.code,
    description: c.description,
    status: c.status,
    _count: c._count,
  }));
}

// 2. Expenses (Strictly branch-isolated)
export async function getExpenses(shopId: string, branchId?: string | null): Promise<IExpense[]> {
  const expenses = await prisma.expense.findMany({
    where: {
      shopId,
      ...(branchId ? { branchId } : {}),
    },
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
    branchName: e.branch?.name || "Main Branch",
    createdAt: e.createdAt,
  }));
}

// 3. Other Incomes (Accepts branchId)
export async function getOtherIncomes(shopId: string, branchId?: string | null): Promise<IOtherIncome[]> {
  const incomes = await prisma.otherIncome.findMany({
    where: {
      shopId,
      ...(branchId ? { branchId } : {}),
    },
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

// 4. Company Assets (Includes branch relation & fixes branchName mapping)
export async function getCompanyAssets(shopId: string, branchId?: string | null): Promise<ICompanyAsset[]> {
  const assets = await prisma.companyAsset.findMany({
    where: {
      shopId,
      // Shows assets assigned to this branch + global/head-office assets
      ...(branchId
        ? {
            OR: [
              { branchId: branchId },
              { branchId: null },
            ],
          }
        : {}),
    },
    include: {
      branch: { select: { name: true } }, // 👈 FETCH RELATION
    },
    orderBy: { createdAt: "desc" },
  });

  return assets.map((a) => ({
    id: a.id,
    name: a.name,
    assetCode: a.assetCode,
    serialNumber: a.serialNumber,
    purchaseDate: a.purchaseDate,
    purchaseCost: Number(a.purchaseCost),
    currentValue: Number(a.currentValue),
    condition: a.condition as "GOOD" | "MAINTENANCE" | "DAMAGED" | "DISPOSED",
    notes: a.notes,
    // 👈 FIXED: a.branch?.name instead of non-existent a.branchName
    branchName: a.branch?.name || "All Branches",
  }));
}

// 5. Owner Equity / Transactions
export async function getOwnerTransactions(shopId: string): Promise<IOwnerTransaction[]> {
  const transactions = await prisma.ownerTransaction.findMany({
    where: { shopId },
    orderBy: { transactionDate: "desc" },
  });

  return transactions.map((t) => ({
    id: t.id,
    type: t.type as "CAPITAL" | "DRAWING",
    transactionDate: t.transactionDate,
    amount: Number(t.amount),
    paymentMethod: t.paymentMethod,
    reference: t.reference,
    purpose: t.purpose,
    notes: t.notes,
    createdAt: t.createdAt,
  }));
}