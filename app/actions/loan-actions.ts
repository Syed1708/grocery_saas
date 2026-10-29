"use server";

import { requireAuth } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { loanSchema } from "@/lib/validations";
import { PERMISSIONS } from "@/types";

export async function createLoanAction(formData: FormData) {
  try {
            const user = await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });

    const validated = loanSchema.safeParse({
      type: formData.get("type")?.toString() || "TAKEN",
      personName: formData.get("personName")?.toString().trim(),
      phone: formData.get("phone")?.toString().trim() || null,
      amount: formData.get("amount"),
      loanDate: formData.get("loanDate")?.toString() || new Date().toISOString(),
      dueDate: formData.get("dueDate")?.toString() || null,
      accountId: formData.get("accountId")?.toString(),
      notes: formData.get("notes")?.toString().trim() || null,
    });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const data = validated.data;
    const account = await prisma.account.findFirst({
      where: { id: data.accountId, shopId: user.shopId },
    });

    if (!account) return { success: false, error: "Selected account/wallet not found." };

    if (data.type === "GIVEN" && Number(account.currentBalance) < data.amount) {
      return { success: false, error: `Insufficient balance in "${account.name}" to lend out this amount.` };
    }

    const voucherNo = `LOAN-${Date.now().toString().slice(-6)}`;

    // 👈 ATOMIC TRANSACTION
    await prisma.$transaction(async (tx) => {
      // 1. Create Loan Record
      await tx.loan.create({
        data: {
          type: data.type,
          personName: data.personName,
          phone: data.phone,
          amount: data.amount,
          totalPaid: 0,
          remainingAmount: data.amount,
          loanDate: new Date(data.loanDate),
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          status: "ACTIVE",
          notes: data.notes,
          accountId: data.accountId,
          branchId: user.activeBranchId!,
          shopId: user.shopId,
        },
      });

      // 2. Adjust Account Balance & Ledger Transaction
      let newBal = Number(account.currentBalance);
      if (data.type === "TAKEN") {
        newBal += data.amount; // Money enters our account
      } else {
        newBal -= data.amount; // Money leaves our account
      }

      await tx.account.update({
        where: { id: data.accountId },
        data: { currentBalance: newBal },
      });

      await tx.accountTransaction.create({
        data: {
          type: "LOAN",
          amount: data.amount,
          balanceAfter: newBal,
          transactionDate: new Date(data.loanDate),
          voucherNo,
          note: data.type === "TAKEN" ? `Loan Taken from ${data.personName}` : `Loan Given to ${data.personName}`,
          branchId: user.activeBranchId!,
          accountId: data.accountId,
          userId: user.userId,
        },
      });
    });

    revalidatePath("/dashboard/admin/accounts");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to record loan." };
  }
}

export async function addLoanInstallmentAction(formData: FormData) {
  try {
            const user = await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });

    const loanId = formData.get("loanId")?.toString();
    const accountId = formData.get("accountId")?.toString();
    const amount = parseFloat(formData.get("amount")?.toString() || "0");
    const paymentDate = formData.get("paymentDate")?.toString() || new Date().toISOString();
    const note = formData.get("notes")?.toString().trim() || null;

    if (!loanId || !accountId || amount <= 0) {
      return { success: false, error: "Please provide valid loan, account, and amount." };
    }

    const loan = await prisma.loan.findFirst({ where: { id: loanId, shopId: user.shopId } });
    if (!loan) return { success: false, error: "Loan record not found." };

    if (amount > Number(loan.remainingAmount)) {
      return { success: false, error: `Installment cannot exceed remaining balance (${loan.remainingAmount}).` };
    }

    const account = await prisma.account.findFirst({ where: { id: accountId, shopId: user.shopId } });
    if (!account) return { success: false, error: "Account/wallet not found." };

    if (loan.type === "TAKEN" && Number(account.currentBalance) < amount) {
      return { success: false, error: `Insufficient balance in "${account.name}" to repay this loan.` };
    }

    const voucherNo = `INST-${Date.now().toString().slice(-6)}`;

    // 👈 ATOMIC REPAYMENT TRANSACTION
    await prisma.$transaction(async (tx) => {
      await tx.loanInstallment.create({
        data: {
          voucherNo,
          paymentDate: new Date(paymentDate),
          amount,
          note,
          loanId,
          accountId,
          branchId: user.activeBranchId!,
          userId: user.userId,
        },
      });

      const newTotalPaid = Number(loan.totalPaid) + amount;
      const newRemaining = Math.max(0, Number(loan.remainingAmount) - amount);
      const newStatus = newRemaining === 0 ? "PAID" : "ACTIVE";

      await tx.loan.update({
        where: { id: loanId },
        data: {
          totalPaid: newTotalPaid,
          remainingAmount: newRemaining,
          status: newStatus,
        },
      });

      let newBal = Number(account.currentBalance);
      if (loan.type === "TAKEN") {
        newBal -= amount; // Repaying loan leaves account
      } else {
        newBal += amount; // Collecting loan enters account
      }

      await tx.account.update({
        where: { id: accountId },
        data: { currentBalance: newBal },
      });

      await tx.accountTransaction.create({
        data: {
          type: "LOAN",
          amount,
          balanceAfter: newBal,
          transactionDate: new Date(paymentDate),
          voucherNo,
          note: loan.type === "TAKEN" ? `Loan Repayment to ${loan.personName}` : `Loan Collection from ${loan.personName}`,
          branchId: user.activeBranchId!,
          accountId,
          userId: user.userId,
        },
      });
    });

    revalidatePath("/dashboard/admin/accounts");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to record installment." };
  }
}

export async function deleteLoanAction(id: string) {
  try {
            const user = await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });
    const loan = await prisma.loan.findFirst({
      where: { id, shopId: user.shopId },
    });

    if (!loan) return { success: false, error: "Loan record not found." };

    if (Number(loan.totalPaid) > 0) {
      return {
        success: false,
        error: "Cannot delete a loan that has recorded repayments.",
      };
    }

    await prisma.loan.delete({ where: { id } });
    revalidatePath("/dashboard/admin/accounts");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete loan record." };
  }
}

export async function updateLoanAction(formData: FormData) {
  try {
            const user = await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });
    const id = formData.get("id")?.toString();
    if (!id) return { success: false, error: "Missing loan ID." };

    const loan = await prisma.loan.findFirst({ where: { id, shopId: user.shopId } });
    if (!loan) return { success: false, error: "Loan not found." };

    const personName = formData.get("personName")?.toString().trim();
    const phone = formData.get("phone")?.toString().trim() || null;
    const dueDate = formData.get("dueDate")?.toString() || null;
    const notes = formData.get("notes")?.toString().trim() || null;

    if (!personName) return { success: false, error: "Person name is required." };

    await prisma.loan.update({
      where: { id },
      data: {
        personName,
        phone,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
      },
    });

    revalidatePath("/dashboard/admin/accounts");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update loan." };
  }
}