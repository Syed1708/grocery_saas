"use server";

import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  expenseCategorySchema,
  expenseSchema,
  otherIncomeSchema,
  companyAssetSchema,
  ownerTransactionSchema,
} from "@/lib/validations";

// ==========================================
// 1. EXPENSE CATEGORIES (TYPES) CRUD
// ==========================================

export async function createExpenseCategoryAction(formData: FormData) {
  try {
    const user = await requireAuth(["OWNER", "MANAGER", "ADMIN"]);
    const id = formData.get("id")?.toString();

    const validated = expenseCategorySchema.safeParse({
      name: formData.get("name")?.toString().trim(),
      code: formData.get("code")?.toString().trim(),
      description: formData.get("description")?.toString().trim() || null,
      status: formData.get("status")?.toString() || "active",
    });

    if (!validated.success) return { success: false, error: validated.error.issues[0].message };
    const data = validated.data;

    if (id) {
      await prisma.expenseCategory.update({
        where: { id, shopId: user.shopId },
        data,
      });
    } else {
      await prisma.expenseCategory.create({
        data: { ...data, shopId: user.shopId },
      });
    }

    revalidatePath("/dashboard/admin/expenses");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to save expense category." };
  }
}

export async function deleteExpenseCategoryAction(id: string) {
  try {
    const user = await requireAuth(["OWNER", "MANAGER", "ADMIN"]);
    const cat = await prisma.expenseCategory.findFirst({
      where: { id, shopId: user.shopId },
      include: { _count: { select: { expenses: true } } },
    });
    if (!cat) return { success: false, error: "Category not found." };
    if (cat._count.expenses > 0) {
      return { success: false, error: `Cannot delete: ${cat._count.expenses} expenses are linked to this category.` };
    }

    await prisma.expenseCategory.delete({ where: { id } });
    revalidatePath("/dashboard/admin/expenses");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete category." };
  }
}

// ==========================================
// 2. DAILY EXPENSES CRUD
// ==========================================

export async function createOrUpdateExpenseAction(formData: FormData) {
  try {
    const user = await requireAuth(["OWNER", "MANAGER", "ADMIN"]);
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

    if (!validated.success) return { success: false, error: validated.error.issues[0].message };
    const data = validated.data;

    await prisma.$transaction(async (tx) => {
      if (id) {
        await tx.expense.update({
          where: { id, shopId: user.shopId },
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
      } else {
        await tx.expense.create({
          data: {
            categoryId: data.categoryId,
            voucherNo: data.voucherNo,
            expenseDate: new Date(data.expenseDate),
            amount: data.amount,
            paymentMethod: data.paymentMethod,
            reference: data.reference,
            note: data.note,
            branchId: user.activeBranchId!,
            userId: user.userId,
            shopId: user.shopId,
          },
        });

        // Deduct from cash drawer
        const cashAcc = await tx.account.findFirst({
          where: { shopId: user.shopId, branchId: user.activeBranchId!, type: "CASH" },
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
              branchId: user.activeBranchId!,
              accountId: cashAcc.id,
              userId: user.userId,
            },
          });
        }
      }
    });

    revalidatePath("/dashboard/admin/expenses");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to save expense." };
  }
}

export async function deleteExpenseAction(id: string) {
  try {
    const user = await requireAuth(["OWNER", "MANAGER", "ADMIN"]);
    const expense = await prisma.expense.findFirst({ where: { id, shopId: user.shopId } });
    if (!expense) return { success: false, error: "Expense not found." };

    await prisma.expense.delete({ where: { id } });
    revalidatePath("/dashboard/admin/expenses");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete expense." };
  }
}

// ==========================================
// 3. OTHER INCOMES CRUD
// ==========================================

export async function createOrUpdateOtherIncomeAction(formData: FormData) {
  try {
    const user = await requireAuth(["OWNER", "MANAGER", "ADMIN"]);
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

    if (!validated.success) return { success: false, error: validated.error.issues[0].message };
    const data = validated.data;

    await prisma.$transaction(async (tx) => {
      if (id) {
        await tx.otherIncome.update({
          where: { id, shopId: user.shopId },
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
      } else {
        await tx.otherIncome.create({
          data: {
            incomeSource: data.incomeSource,
            receiptNo: data.receiptNo,
            incomeDate: new Date(data.incomeDate),
            amount: data.amount,
            paymentMethod: data.paymentMethod,
            reference: data.reference,
            note: data.note,
            branchId: user.activeBranchId!,
            userId: user.userId,
            shopId: user.shopId,
          },
        });

        const cashAcc = await tx.account.findFirst({
          where: { shopId: user.shopId, branchId: user.activeBranchId!, type: "CASH" },
        });
        if (cashAcc) {
          const newBal = Number(cashAcc.currentBalance) + data.amount;
          await tx.account.update({ where: { id: cashAcc.id }, data: { currentBalance: newBal } });
        }
      }
    });

    revalidatePath("/dashboard/admin/expenses");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to save income." };
  }
}

export async function deleteOtherIncomeAction(id: string) {
  try {
    const user = await requireAuth(["OWNER", "MANAGER", "ADMIN"]);
    await prisma.otherIncome.delete({ where: { id, shopId: user.shopId } });
    revalidatePath("/dashboard/admin/expenses");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete income." };
  }
}

// ==========================================
// 4. COMPANY ASSETS CRUD
// ==========================================

export async function createOrUpdateCompanyAssetAction(formData: FormData) {
  try {
    const user = await requireAuth(["OWNER", "MANAGER", "ADMIN"]);
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

    if (!validated.success) return { success: false, error: validated.error.issues[0].message };
    const data = validated.data;

    if (id) {
      await prisma.companyAsset.update({
        where: { id, shopId: user.shopId },
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

    revalidatePath("/dashboard/admin/expenses");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to save asset." };
  }
}

export async function deleteCompanyAssetAction(id: string) {
  try {
    const user = await requireAuth(["OWNER", "MANAGER", "ADMIN"]);
    await prisma.companyAsset.delete({ where: { id, shopId: user.shopId } });
    revalidatePath("/dashboard/admin/expenses");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete asset." };
  }
}

// ==========================================
// 5. OWNER EQUITY (CAPITAL / DRAWING) CRUD
// ==========================================

export async function createOrUpdateOwnerTransactionAction(formData: FormData) {
  try {
    const user = await requireAuth(["OWNER", "ADMIN", "SUPER_ADMIN"]);
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

    if (!validated.success) return { success: false, error: validated.error.issues[0].message };
    const data = validated.data;

    if (id) {
      await prisma.ownerTransaction.update({
        where: { id, shopId: user.shopId },
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

    revalidatePath("/dashboard/admin/expenses");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to save equity transaction." };
  }
}

export async function deleteOwnerTransactionAction(id: string) {
  try {
    const user = await requireAuth(["OWNER", "ADMIN", "SUPER_ADMIN"]);
    await prisma.ownerTransaction.delete({ where: { id, shopId: user.shopId } });
    revalidatePath("/dashboard/admin/expenses");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete transaction." };
  }
}