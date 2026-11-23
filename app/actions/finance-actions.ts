"use server";

import { requireAuth } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
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
// 2. DAILY EXPENSES CRUD (cash-drawer reconciled)
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

    if (id) {
      const existing = await prisma.expense.findFirst({
        where: { id, shopId: user.shopId, branchId: user.activeBranchId },
      });
      if (!existing) return { success: false, error: "Expense not found in this branch." };

      const delta = Number(data.amount) - Number(existing.amount);

      await prisma.$transaction(async (tx) => {
        await tx.expense.update({
          where: { id },
          data: {
            categoryId: data.categoryId,
            voucherNo: data.voucherNo,
            expenseDate: new Date(data.expenseDate),
            amount: data.amount,
            paymentMethod: data.paymentMethod,
            reference: data.reference,
            note: data.note,
          },
        });

        if (delta !== 0) {
          const cashAcc = await tx.account.findFirst({
            where: { shopId: user.shopId, branchId: user.activeBranchId, type: "CASH" },
          });
          if (cashAcc) {
            const newBal = Number(cashAcc.currentBalance) - delta;
            await tx.account.update({ where: { id: cashAcc.id }, data: { currentBalance: newBal } });
            await tx.accountTransaction.create({
              data: {
                type: "EXPENSE",
                amount: Math.abs(delta),
                balanceAfter: newBal,
                transactionDate: new Date(data.expenseDate),
                voucherNo: data.voucherNo,
                note: `Expense adjustment: ${data.note || data.voucherNo}`,
                branchId: user.activeBranchId,
                accountId: cashAcc.id,
                userId: user.userId,
              },
            });
          }
        }
      });
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.expense.create({
          data: {
            categoryId: data.categoryId,
            voucherNo: data.voucherNo,
            expenseDate: new Date(data.expenseDate),
            amount: data.amount,
            paymentMethod: data.paymentMethod,
            reference: data.reference,
            note: data.note,
            branchId: user.activeBranchId,
            userId: user.userId,
            shopId: user.shopId,
          },
        });

        const cashAcc = await tx.account.findFirst({
          where: { shopId: user.shopId, branchId: user.activeBranchId, type: "CASH" },
        });
        if (cashAcc) {
          const newBal = Number(cashAcc.currentBalance) - data.amount;
          await tx.account.update({ where: { id: cashAcc.id }, data: { currentBalance: newBal } });
          await tx.accountTransaction.create({
            data: {
              type: "EXPENSE",
              amount: data.amount,
              balanceAfter: newBal,
              transactionDate: new Date(data.expenseDate),
              voucherNo: data.voucherNo,
              note: `Expense: ${data.note || data.voucherNo}`,
              branchId: user.activeBranchId,
              accountId: cashAcc.id,
              userId: user.userId,
            },
          });
        }
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
    });
    if (!expense) return { success: false, error: "Expense not found." };

    await prisma.$transaction(async (tx) => {
      const cashAcc = await tx.account.findFirst({
        where: { shopId: user.shopId, branchId: user.activeBranchId, type: "CASH" },
      });
      if (cashAcc) {
        const newBal = Number(cashAcc.currentBalance) + Number(expense.amount);
        await tx.account.update({ where: { id: cashAcc.id }, data: { currentBalance: newBal } });
        await tx.accountTransaction.create({
          data: {
            type: "EXPENSE",
            amount: Number(expense.amount),
            balanceAfter: newBal,
            voucherNo: expense.voucherNo,
            note: "Expense reversal (deleted)",
            branchId: user.activeBranchId,
            accountId: cashAcc.id,
            userId: user.userId,
          },
        });
      }
      await tx.expense.delete({ where: { id } });
    });

    revalidateFinance();
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Failed to delete expense.") };
  }
}

// ==========================================
// 3. OTHER INCOMES CRUD (cash-drawer reconciled)
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

    if (id) {
      const existing = await prisma.otherIncome.findFirst({
        where: { id, shopId: user.shopId, branchId: user.activeBranchId },
      });
      if (!existing) return { success: false, error: "Income record not found in this branch." };

      const delta = Number(data.amount) - Number(existing.amount);

      await prisma.$transaction(async (tx) => {
        await tx.otherIncome.update({
          where: { id },
          data: {
            incomeSource: data.incomeSource,
            receiptNo: data.receiptNo,
            incomeDate: new Date(data.incomeDate),
            amount: data.amount,
            paymentMethod: data.paymentMethod,
            reference: data.reference,
            note: data.note,
          },
        });

        if (delta !== 0) {
          const cashAcc = await tx.account.findFirst({
            where: { shopId: user.shopId, branchId: user.activeBranchId, type: "CASH" },
          });
          if (cashAcc) {
            const newBal = Number(cashAcc.currentBalance) + delta;
            await tx.account.update({ where: { id: cashAcc.id }, data: { currentBalance: newBal } });
            await tx.accountTransaction.create({
              data: {
                type: "INCOME",
                amount: Math.abs(delta),
                balanceAfter: newBal,
                transactionDate: new Date(data.incomeDate),
                voucherNo: data.receiptNo,
                note: `Income adjustment: ${data.note || data.receiptNo}`,
                branchId: user.activeBranchId,
                accountId: cashAcc.id,
                userId: user.userId,
              },
            });
          }
        }
      });
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.otherIncome.create({
          data: {
            incomeSource: data.incomeSource,
            receiptNo: data.receiptNo,
            incomeDate: new Date(data.incomeDate),
            amount: data.amount,
            paymentMethod: data.paymentMethod,
            reference: data.reference,
            note: data.note,
            branchId: user.activeBranchId,
            userId: user.userId,
            shopId: user.shopId,
          },
        });

        const cashAcc = await tx.account.findFirst({
          where: { shopId: user.shopId, branchId: user.activeBranchId, type: "CASH" },
        });
        if (cashAcc) {
          const newBal = Number(cashAcc.currentBalance) + data.amount;
          await tx.account.update({ where: { id: cashAcc.id }, data: { currentBalance: newBal } });
          await tx.accountTransaction.create({
            data: {
              type: "INCOME",
              amount: data.amount,
              balanceAfter: newBal,
              transactionDate: new Date(data.incomeDate),
              voucherNo: data.receiptNo,
              note: `Income: ${data.incomeSource}`,
              branchId: user.activeBranchId,
              accountId: cashAcc.id,
              userId: user.userId,
            },
          });
        }
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
    });
    if (!income) return { success: false, error: "Income record not found." };

    await prisma.$transaction(async (tx) => {
      const cashAcc = await tx.account.findFirst({
        where: { shopId: user.shopId, branchId: user.activeBranchId, type: "CASH" },
      });
      if (cashAcc) {
        const newBal = Number(cashAcc.currentBalance) - Number(income.amount);
        await tx.account.update({ where: { id: cashAcc.id }, data: { currentBalance: newBal } });
        await tx.accountTransaction.create({
          data: {
            type: "INCOME",
            amount: Number(income.amount),
            balanceAfter: newBal,
            voucherNo: income.receiptNo,
            note: "Income reversal (deleted)",
            branchId: user.activeBranchId,
            accountId: cashAcc.id,
            userId: user.userId,
          },
        });
      }
      await tx.otherIncome.delete({ where: { id } });
    });

    revalidateFinance();
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Failed to delete income.") };
  }
}

// ==========================================
// 4. COMPANY ASSETS CRUD (branch + global assets)
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
    });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }
    const data = validated.data;

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

      await prisma.companyAsset.update({
        where: { id },
        data: { ...data, purchaseDate: new Date(data.purchaseDate) },
      });
    } else {
      await prisma.companyAsset.create({
        data: {
          ...data,
          purchaseDate: new Date(data.purchaseDate),
          branchId: user.activeBranchId,
          shopId: user.shopId,
        },
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

    await prisma.companyAsset.delete({ where: { id } });
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

    if (id) {
      const existing = await prisma.ownerTransaction.findFirst({
        where: { id, shopId: user.shopId },
        select: { id: true },
      });
      if (!existing) return { success: false, error: "Transaction not found." };

      await prisma.ownerTransaction.update({
        where: { id },
        data: { ...data, transactionDate: new Date(data.transactionDate) },
      });
    } else {
      await prisma.ownerTransaction.create({
        data: {
          ...data,
          transactionDate: new Date(data.transactionDate),
          branchId: user.activeBranchId,
          shopId: user.shopId,
        },
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

    await prisma.ownerTransaction.delete({ where: { id } });
    revalidateFinance();
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Failed to delete transaction.") };
  }
}
