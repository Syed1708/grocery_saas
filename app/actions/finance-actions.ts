"use server";

import { requireAuth } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import {
  expenseCategorySchema,
  expenseSchema,
  otherIncomeSchema,
  companyAssetSchema,
  ownerTransactionSchema,
} from "@/lib/validations";
import { PERMISSIONS } from "@/types";
import { getErrorMessage } from "@/lib/utils";

const FINANCE_REVALIDATE_PATHS = ["/dashboard/admin/expenses"];

function revalidateFinance() {
  for (const path of FINANCE_REVALIDATE_PATHS) revalidatePath(path);
}

// ==========================================
// PAYMENT METHOD → ACCOUNT LEDGER HELPERS
// ==========================================

type Tx = Prisma.TransactionClient;
type Direction = "IN" | "OUT";
type LedgerType = "EXPENSE" | "INCOME" | "DEPOSIT" | "WITHDRAW";

const PAYMENT_METHODS = ["cash", "bank", "bkash", "nagad", "rocket", "other"] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number];

function normalizePaymentMethod(value?: string | null): PaymentMethod {
  const method = (value || "cash").trim().toLowerCase();
  return (PAYMENT_METHODS as readonly string[]).includes(method)
    ? (method as PaymentMethod)
    : "cash";
}

function accountTypeForMethod(method: PaymentMethod) {
  return method.toUpperCase() as "CASH" | "BANK" | "BKASH" | "NAGAD" | "ROCKET" | "OTHER";
}

async function findMethodAccount(
  tx: Tx,
  shopId: string,
  branchId: string,
  method: PaymentMethod
) {
  const type = accountTypeForMethod(method);
  const account = await tx.account.findFirst({
    where: { shopId, branchId, type, status: "active" },
    select: { id: true, currentBalance: true },
  });
  if (!account) {
    throw new Error(`No ${type} account found in this branch. Please add one from Accounts first.`);
  }
  return account;
}

interface LedgerContext {
  shopId: string;
  branchId: string;
  userId: string;
}

interface LedgerEntry {
  method: string;
  direction: Direction;
  amount: number;
  type: LedgerType;
  referenceType: string;
  referenceId: string;
  transactionDate?: Date;
  voucherNo?: string | null;
  note: string;
}

async function applyLedger(tx: Tx, ctx: LedgerContext, entry: LedgerEntry) {
  const amount = Number(entry.amount);
  if (amount <= 0) return;

  const account = await findMethodAccount(tx, ctx.shopId, ctx.branchId, normalizePaymentMethod(entry.method));
  const current = Number(account.currentBalance);
  const newBalance = entry.direction === "IN" ? current + amount : current - amount;

  await tx.account.update({
    where: { id: account.id },
    data: { currentBalance: newBalance },
  });
  await tx.accountTransaction.create({
    data: {
      type: entry.type,
      amount,
      balanceAfter: newBalance,
      transactionDate: entry.transactionDate ?? new Date(),
      referenceType: entry.referenceType,
      referenceId: entry.referenceId,
      voucherNo: entry.voucherNo ?? null,
      note: entry.note,
      branchId: ctx.branchId,
      accountId: account.id,
      userId: ctx.userId,
    },
  });
}

// Reverses every posted entry for a record, using the account and direction it originally hit.
// Legacy rows (created before ledger references existed) fall back to their old CASH effect.
async function reverseLedger(
  tx: Tx,
  ctx: LedgerContext,
  referenceType: string,
  referenceId: string,
  legacy?: { amount: number; wasOutgoing: boolean }
) {
  const entries = await tx.accountTransaction.findMany({
    where: { referenceType, referenceId },
  });

  if (entries.length === 0 && legacy && Number(legacy.amount) > 0) {
    const account = await tx.account.findFirst({
      where: { shopId: ctx.shopId, branchId: ctx.branchId, type: "CASH" },
      select: { id: true, currentBalance: true },
    });
    if (account) {
      const amount = Number(legacy.amount);
      const newBalance = legacy.wasOutgoing
        ? Number(account.currentBalance) + amount
        : Number(account.currentBalance) - amount;
      await tx.account.update({
        where: { id: account.id },
        data: { currentBalance: newBalance },
      });
      await tx.accountTransaction.create({
        data: {
          type: legacy.wasOutgoing ? "DEPOSIT" : "WITHDRAW",
          amount,
          balanceAfter: newBalance,
          referenceType: `${referenceType}_REVERSAL`,
          referenceId,
          note: `Legacy reversal: ${referenceType}`,
          branchId: ctx.branchId,
          accountId: account.id,
          userId: ctx.userId,
        },
      });
    }
    return;
  }

  for (const entry of entries) {
    const account = await tx.account.findUnique({
      where: { id: entry.accountId },
      select: { currentBalance: true },
    });
    if (!account) continue;

    const amount = Number(entry.amount);
    const wasOutgoing = ["EXPENSE", "WITHDRAW", "PURCHASE", "PAYROLL", "LOAN", "TRANSFER_OUT"].includes(
      entry.type
    );
    const newBalance = wasOutgoing
      ? Number(account.currentBalance) + amount
      : Number(account.currentBalance) - amount;

    await tx.account.update({
      where: { id: entry.accountId },
      data: { currentBalance: newBalance },
    });
    await tx.accountTransaction.create({
      data: {
        type: wasOutgoing ? "DEPOSIT" : "WITHDRAW",
        amount,
        balanceAfter: newBalance,
        referenceType: `${referenceType}_REVERSAL`,
        referenceId,
        voucherNo: entry.voucherNo,
        note: `Reversal: ${entry.note || referenceType}`,
        branchId: entry.branchId,
        accountId: entry.accountId,
        userId: ctx.userId,
      },
    });
    await tx.accountTransaction.delete({ where: { id: entry.id } });
  }
}

// ==========================================
// 1. EXPENSE CATEGORIES (TYPES) CRUD
// ==========================================

export async function createExpenseCategoryAction(formData: FormData) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.FINANCE_EXPENSES,
      requireActiveStatus: true,
    });

    const id = formData.get("id")?.toString();

    const validated = expenseCategorySchema.safeParse({
      name: formData.get("name")?.toString().trim(),
      code: formData.get("code")?.toString().trim(),
      description: formData.get("description")?.toString().trim() || null,
      status: formData.get("status")?.toString() || "active",
    });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }
    const data = validated.data;

    if (id) {
      const existing = await prisma.expenseCategory.findFirst({
        where: { id, shopId: user.shopId },
        select: { id: true },
      });
      if (!existing) return { success: false, error: "Category not found." };
      await prisma.expenseCategory.update({ where: { id }, data });
    } else {
      await prisma.expenseCategory.create({
        data: { ...data, shopId: user.shopId },
      });
    }

    revalidateFinance();
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Failed to save expense category.") };
  }
}

export async function deleteExpenseCategoryAction(id: string) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.FINANCE_EXPENSES,
      requireActiveStatus: true,
    });
    const cat = await prisma.expenseCategory.findFirst({
      where: { id, shopId: user.shopId },
      include: { _count: { select: { expenses: true } } },
    });
    if (!cat) return { success: false, error: "Category not found." };
    if (cat._count.expenses > 0) {
      return {
        success: false,
        error: `Cannot delete: ${cat._count.expenses} expenses are linked to this category.`,
      };
    }

    await prisma.expenseCategory.delete({ where: { id } });
    revalidateFinance();
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Failed to delete category.") };
  }
}

// ==========================================
// 2. DAILY EXPENSES CRUD
// ==========================================

export async function createOrUpdateExpenseAction(formData: FormData) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.FINANCE_EXPENSES,
      requireActiveStatus: true,
    });
    const id = formData.get("id")?.toString();

    const validated = expenseSchema.safeParse({
      categoryId: formData.get("categoryId")?.toString(),
      voucherNo: formData.get("voucherNo")?.toString().trim(),
      expenseDate: formData.get("expenseDate")?.toString(),
      amount: formData.get("amount"),
      paymentMethod: formData.get("paymentMethod")?.toString() || "cash",
      reference: formData.get("reference")?.toString().trim() || null,
      note: formData.get("note")?.toString().trim() || null,
    });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }
    const data = validated.data;
    const ctx: LedgerContext = {
      shopId: user.shopId,
      branchId: user.activeBranchId,
      userId: user.userId,
    };
    const ledger = {
      method: data.paymentMethod,
      direction: "OUT" as Direction,
      amount: data.amount,
      type: "EXPENSE" as LedgerType,
      referenceType: "EXPENSE",
      transactionDate: new Date(data.expenseDate),
      voucherNo: data.voucherNo,
      note: `Expense: ${data.note || data.voucherNo}`,
    };

    if (id) {
      const existing = await prisma.expense.findFirst({
        where: { id, shopId: user.shopId, branchId: user.activeBranchId },
      });
      if (!existing) return { success: false, error: "Expense not found in this branch." };

      await prisma.$transaction(async (tx) => {
        await reverseLedger(tx, ctx, "EXPENSE", id, {
          amount: Number(existing.amount),
          wasOutgoing: true,
        });
        await tx.expense.update({
          where: { id },
          data: {
            categoryId: data.categoryId,
            voucherNo: data.voucherNo,
            expenseDate: new Date(data.expenseDate),
            amount: data.amount,
            paymentMethod: normalizePaymentMethod(data.paymentMethod),
            reference: data.reference,
            note: data.note,
          },
        });
        await applyLedger(tx, ctx, { ...ledger, referenceId: id });
      });
    } else {
      await prisma.$transaction(async (tx) => {
        const expense = await tx.expense.create({
          data: {
            categoryId: data.categoryId,
            voucherNo: data.voucherNo,
            expenseDate: new Date(data.expenseDate),
            amount: data.amount,
            paymentMethod: normalizePaymentMethod(data.paymentMethod),
            reference: data.reference,
            note: data.note,
            branchId: user.activeBranchId,
            userId: user.userId,
            shopId: user.shopId,
          },
        });
        await applyLedger(tx, ctx, { ...ledger, referenceId: expense.id });
      });
    }

    revalidateFinance();
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Failed to save expense.") };
  }
}

export async function deleteExpenseAction(id: string) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.FINANCE_EXPENSES,
      requireActiveStatus: true,
    });
    const expense = await prisma.expense.findFirst({
      where: { id, shopId: user.shopId, branchId: user.activeBranchId },
      select: { id: true, amount: true },
    });
    if (!expense) return { success: false, error: "Expense not found." };

    const ctx: LedgerContext = {
      shopId: user.shopId,
      branchId: user.activeBranchId,
      userId: user.userId,
    };

    await prisma.$transaction(async (tx) => {
      await reverseLedger(tx, ctx, "EXPENSE", id, {
        amount: Number(expense.amount),
        wasOutgoing: true,
      });
      await tx.expense.delete({ where: { id } });
    });

    revalidateFinance();
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Failed to delete expense.") };
  }
}

// ==========================================
// 3. OTHER INCOMES CRUD
// ==========================================

export async function createOrUpdateOtherIncomeAction(formData: FormData) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.FINANCE_EXPENSES,
      requireActiveStatus: true,
    });

    const id = formData.get("id")?.toString();

    const validated = otherIncomeSchema.safeParse({
      incomeSource: formData.get("incomeSource")?.toString().trim(),
      receiptNo: formData.get("receiptNo")?.toString().trim(),
      incomeDate: formData.get("incomeDate")?.toString(),
      amount: formData.get("amount"),
      paymentMethod: formData.get("paymentMethod")?.toString() || "cash",
      reference: formData.get("reference")?.toString().trim() || null,
      note: formData.get("note")?.toString().trim() || null,
    });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }
    const data = validated.data;
    const ctx: LedgerContext = {
      shopId: user.shopId,
      branchId: user.activeBranchId,
      userId: user.userId,
    };
    const ledger = {
      method: data.paymentMethod,
      direction: "IN" as Direction,
      amount: data.amount,
      type: "INCOME" as LedgerType,
      referenceType: "INCOME",
      transactionDate: new Date(data.incomeDate),
      voucherNo: data.receiptNo,
      note: `Income: ${data.incomeSource}`,
    };

    if (id) {
      const existing = await prisma.otherIncome.findFirst({
        where: { id, shopId: user.shopId, branchId: user.activeBranchId },
      });
      if (!existing) return { success: false, error: "Income record not found in this branch." };

      await prisma.$transaction(async (tx) => {
        await reverseLedger(tx, ctx, "INCOME", id, {
          amount: Number(existing.amount),
          wasOutgoing: false,
        });
        await tx.otherIncome.update({
          where: { id },
          data: {
            incomeSource: data.incomeSource,
            receiptNo: data.receiptNo,
            incomeDate: new Date(data.incomeDate),
            amount: data.amount,
            paymentMethod: normalizePaymentMethod(data.paymentMethod),
            reference: data.reference,
            note: data.note,
          },
        });
        await applyLedger(tx, ctx, { ...ledger, referenceId: id });
      });
    } else {
      await prisma.$transaction(async (tx) => {
        const income = await tx.otherIncome.create({
          data: {
            incomeSource: data.incomeSource,
            receiptNo: data.receiptNo,
            incomeDate: new Date(data.incomeDate),
            amount: data.amount,
            paymentMethod: normalizePaymentMethod(data.paymentMethod),
            reference: data.reference,
            note: data.note,
            branchId: user.activeBranchId,
            userId: user.userId,
            shopId: user.shopId,
          },
        });
        await applyLedger(tx, ctx, { ...ledger, referenceId: income.id });
      });
    }

    revalidateFinance();
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Failed to save income.") };
  }
}

export async function deleteOtherIncomeAction(id: string) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.FINANCE_EXPENSES,
      requireActiveStatus: true,
    });
    const income = await prisma.otherIncome.findFirst({
      where: { id, shopId: user.shopId, branchId: user.activeBranchId },
      select: { id: true, amount: true },
    });
    if (!income) return { success: false, error: "Income record not found." };

    const ctx: LedgerContext = {
      shopId: user.shopId,
      branchId: user.activeBranchId,
      userId: user.userId,
    };

    await prisma.$transaction(async (tx) => {
      await reverseLedger(tx, ctx, "INCOME", id, {
        amount: Number(income.amount),
        wasOutgoing: false,
      });
      await tx.otherIncome.delete({ where: { id } });
    });

    revalidateFinance();
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Failed to delete income.") };
  }
}

// ==========================================
// 4. COMPANY ASSETS CRUD (purchase hits an account)
// ==========================================

export async function createOrUpdateCompanyAssetAction(formData: FormData) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.FINANCE_EXPENSES,
      requireActiveStatus: true,
    });
    const id = formData.get("id")?.toString();

    const validated = companyAssetSchema.safeParse({
      name: formData.get("name")?.toString().trim(),
      assetCode: formData.get("assetCode")?.toString().trim(),
      serialNumber: formData.get("serialNumber")?.toString().trim() || null,
      purchaseDate: formData.get("purchaseDate")?.toString(),
      purchaseCost: formData.get("purchaseCost"),
      currentValue: formData.get("currentValue"),
      condition: formData.get("condition")?.toString() || "GOOD",
      notes: formData.get("notes")?.toString().trim() || null,
      paymentMethod: formData.get("paymentMethod")?.toString() || "cash",
    });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }
    const data = validated.data;
    const ctx: LedgerContext = {
      shopId: user.shopId,
      branchId: user.activeBranchId,
      userId: user.userId,
    };
    const ledger = {
      method: data.paymentMethod,
      direction: "OUT" as Direction,
      amount: data.purchaseCost,
      type: "EXPENSE" as LedgerType,
      referenceType: "ASSET",
      transactionDate: new Date(data.purchaseDate),
      voucherNo: data.assetCode,
      note: `Asset purchase: ${data.name}`,
    };

    if (id) {
      const existing = await prisma.companyAsset.findFirst({
        where: {
          id,
          shopId: user.shopId,
          OR: [{ branchId: user.activeBranchId }, { branchId: null }],
        },
        select: { id: true },
      });
      if (!existing) return { success: false, error: "Asset not found in this branch." };

      await prisma.$transaction(async (tx) => {
        await reverseLedger(tx, ctx, "ASSET", id);
        await tx.companyAsset.update({
          where: { id },
          data: {
            name: data.name,
            assetCode: data.assetCode,
            serialNumber: data.serialNumber,
            purchaseDate: new Date(data.purchaseDate),
            purchaseCost: data.purchaseCost,
            currentValue: data.currentValue,
            condition: data.condition,
            notes: data.notes,
          },
        });
        await applyLedger(tx, ctx, { ...ledger, referenceId: id });
      });
    } else {
      await prisma.$transaction(async (tx) => {
        const asset = await tx.companyAsset.create({
          data: {
            name: data.name,
            assetCode: data.assetCode,
            serialNumber: data.serialNumber,
            purchaseDate: new Date(data.purchaseDate),
            purchaseCost: data.purchaseCost,
            currentValue: data.currentValue,
            condition: data.condition,
            notes: data.notes,
            branchId: user.activeBranchId,
            shopId: user.shopId,
          },
        });
        await applyLedger(tx, ctx, { ...ledger, referenceId: asset.id });
      });
    }

    revalidateFinance();
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Failed to save asset.") };
  }
}

export async function deleteCompanyAssetAction(id: string) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.FINANCE_EXPENSES,
      requireActiveStatus: true,
    });
    const asset = await prisma.companyAsset.findFirst({
      where: {
        id,
        shopId: user.shopId,
        OR: [{ branchId: user.activeBranchId }, { branchId: null }],
      },
      select: { id: true },
    });
    if (!asset) return { success: false, error: "Asset not found." };

    const ctx: LedgerContext = {
      shopId: user.shopId,
      branchId: user.activeBranchId,
      userId: user.userId,
    };

    await prisma.$transaction(async (tx) => {
      await reverseLedger(tx, ctx, "ASSET", id);
      await tx.companyAsset.delete({ where: { id } });
    });

    revalidateFinance();
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Failed to delete asset.") };
  }
}

// ==========================================
// 5. OWNER EQUITY (CAPITAL / DRAWING) CRUD
// ==========================================

export async function createOrUpdateOwnerTransactionAction(formData: FormData) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.FINANCE_EXPENSES,
      requireActiveStatus: true,
    });
    const id = formData.get("id")?.toString();

    const validated = ownerTransactionSchema.safeParse({
      type: formData.get("type")?.toString() || "CAPITAL",
      transactionDate: formData.get("transactionDate")?.toString(),
      amount: formData.get("amount"),
      paymentMethod: formData.get("paymentMethod")?.toString() || "cash",
      reference: formData.get("reference")?.toString().trim() || null,
      purpose: formData.get("purpose")?.toString().trim() || null,
      notes: formData.get("notes")?.toString().trim() || null,
    });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }
    const data = validated.data;
    const isCapital = data.type === "CAPITAL";
    const ctx: LedgerContext = {
      shopId: user.shopId,
      branchId: user.activeBranchId,
      userId: user.userId,
    };
    const ledger = {
      method: data.paymentMethod,
      direction: (isCapital ? "IN" : "OUT") as Direction,
      amount: data.amount,
      type: (isCapital ? "DEPOSIT" : "WITHDRAW") as LedgerType,
      referenceType: "EQUITY",
      transactionDate: new Date(data.transactionDate),
      voucherNo: null,
      note: isCapital ? "Owner capital injection" : "Owner drawing",
    };

    if (id) {
      const existing = await prisma.ownerTransaction.findFirst({
        where: { id, shopId: user.shopId },
        select: { id: true },
      });
      if (!existing) return { success: false, error: "Transaction not found." };

      await prisma.$transaction(async (tx) => {
        await reverseLedger(tx, ctx, "EQUITY", id);
        await tx.ownerTransaction.update({
          where: { id },
          data: {
            type: data.type,
            transactionDate: new Date(data.transactionDate),
            amount: data.amount,
            paymentMethod: normalizePaymentMethod(data.paymentMethod),
            reference: data.reference,
            purpose: data.purpose,
            notes: data.notes,
          },
        });
        await applyLedger(tx, ctx, { ...ledger, referenceId: id });
      });
    } else {
      await prisma.$transaction(async (tx) => {
        const equity = await tx.ownerTransaction.create({
          data: {
            type: data.type,
            transactionDate: new Date(data.transactionDate),
            amount: data.amount,
            paymentMethod: normalizePaymentMethod(data.paymentMethod),
            reference: data.reference,
            purpose: data.purpose,
            notes: data.notes,
            branchId: user.activeBranchId,
            shopId: user.shopId,
          },
        });
        await applyLedger(tx, ctx, { ...ledger, referenceId: equity.id });
      });
    }

    revalidateFinance();
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Failed to save equity transaction.") };
  }
}

export async function deleteOwnerTransactionAction(id: string) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.FINANCE_EXPENSES,
      requireActiveStatus: true,
    });
    const existing = await prisma.ownerTransaction.findFirst({
      where: { id, shopId: user.shopId },
      select: { id: true },
    });
    if (!existing) return { success: false, error: "Transaction not found." };

    const ctx: LedgerContext = {
      shopId: user.shopId,
      branchId: user.activeBranchId,
      userId: user.userId,
    };

    await prisma.$transaction(async (tx) => {
      await reverseLedger(tx, ctx, "EQUITY", id);
      await tx.ownerTransaction.delete({ where: { id } });
    });

    revalidateFinance();
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Failed to delete transaction.") };
  }
}
