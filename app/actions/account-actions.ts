"use server";

import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { accountSchema, transferSchema, chequeSchema, loanSchema } from "@/lib/validations";

// --- 1. ACCOUNTS CRUD ---
export async function createAccountAction(formData: FormData) {
  try {
    const user = await requireAuth(["OWNER", "MANAGER", "ADMIN"]);

    const validated = accountSchema.safeParse({
      name: formData.get("name")?.toString().trim(),
      type: formData.get("type")?.toString() || "CASH",
      accountNumber: formData.get("accountNumber")?.toString().trim() || null,
      bankName: formData.get("bankName")?.toString().trim() || null,
      branchName: formData.get("branchName")?.toString().trim() || null,
      openingBalance: formData.get("openingBalance") || 0,
      status: formData.get("status")?.toString() || "active",
      notes: formData.get("notes")?.toString().trim() || null,
    });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const data = validated.data;

    await prisma.$transaction(async (tx) => {
      const account = await tx.account.create({
        data: {
          name: data.name,
          type: data.type,
          accountNumber: data.accountNumber,
          bankName: data.bankName,
          branchName: data.branchName,
          openingBalance: data.openingBalance,
          currentBalance: data.openingBalance,
          status: data.status,
          notes: data.notes,
          branchId: user.activeBranchId!,
          shopId: user.shopId,
        },
      });

      if (data.openingBalance > 0) {
        await tx.accountTransaction.create({
          data: {
            type: "DEPOSIT",
            amount: data.openingBalance,
            balanceAfter: data.openingBalance,
            voucherNo: `OPB-${Date.now().toString().slice(-6)}`,
            note: "Opening Balance",
            branchId: user.activeBranchId!,
            accountId: account.id,
            userId: user.userId,
          },
        });
      }
    });

    revalidatePath("/dashboard/admin/accounts");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create account." };
  }
}

// --- 2. FUND TRANSFER ---
export async function transferFundsAction(formData: FormData) {
  try {
    const user = await requireAuth(["OWNER", "MANAGER", "ADMIN"]);

    const validated = transferSchema.safeParse({
      fromAccountId: formData.get("fromAccountId")?.toString(),
      toAccountId: formData.get("toAccountId")?.toString(),
      amount: formData.get("amount"),
      transferDate: formData.get("transferDate")?.toString() || new Date().toISOString(),
      note: formData.get("note")?.toString().trim() || null,
    });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { fromAccountId, toAccountId, amount, transferDate, note } = validated.data;

    if (fromAccountId === toAccountId) {
      return { success: false, error: "Source and destination accounts cannot be the same." };
    }

    const fromAcc = await prisma.account.findFirst({ where: { id: fromAccountId, shopId: user.shopId } });
    const toAcc = await prisma.account.findFirst({ where: { id: toAccountId, shopId: user.shopId } });

    if (!fromAcc || !toAcc) return { success: false, error: "One or both accounts not found." };

    if (Number(fromAcc.currentBalance) < amount) {
      return { success: false, error: `Insufficient balance in "${fromAcc.name}". Current balance: ৳${fromAcc.currentBalance}` };
    }

    const voucherNo = `TRF-${Date.now().toString().slice(-6)}`;

    await prisma.$transaction(async (tx) => {
      // Deduct source
      const newFromBal = Number(fromAcc.currentBalance) - amount;
      await tx.account.update({
        where: { id: fromAccountId },
        data: { currentBalance: newFromBal },
      });
      await tx.accountTransaction.create({
        data: {
          type: "TRANSFER_OUT",
          amount,
          balanceAfter: newFromBal,
          transactionDate: new Date(transferDate),
          voucherNo,
          note: `Transfer to ${toAcc.name}. ${note || ""}`,
          branchId: user.activeBranchId!,
          accountId: fromAccountId,
          userId: user.userId,
        },
      });

      // Add destination
      const newToBal = Number(toAcc.currentBalance) + amount;
      await tx.account.update({
        where: { id: toAccountId },
        data: { currentBalance: newToBal },
      });
      await tx.accountTransaction.create({
        data: {
          type: "TRANSFER_IN",
          amount,
          balanceAfter: newToBal,
          transactionDate: new Date(transferDate),
          voucherNo,
          note: `Transfer from ${fromAcc.name}. ${note || ""}`,
          branchId: user.activeBranchId!,
          accountId: toAccountId,
          userId: user.userId,
        },
      });
    });

    revalidatePath("/dashboard/admin/accounts");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Fund transfer failed." };
  }
}

// --- 3. BANK CHEQUES ---
export async function createChequeAction(formData: FormData) {
  try {
    const user = await requireAuth(["OWNER", "MANAGER", "ADMIN"]);

    const validated = chequeSchema.safeParse({
      type: formData.get("type")?.toString() || "RECEIVED",
      partyType: formData.get("partyType")?.toString() || "CUSTOMER",
      partyName: formData.get("partyName")?.toString().trim(),
      bankName: formData.get("bankName")?.toString().trim(),
      chequeNumber: formData.get("chequeNumber")?.toString().trim(),
      chequeDate: formData.get("chequeDate")?.toString(),
      amount: formData.get("amount"),
      note: formData.get("note")?.toString().trim() || null,
    });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const data = validated.data;

    await prisma.bankCheque.create({
      data: {
        type: data.type,
        partyType: data.partyType,
        partyName: data.partyName,
        bankName: data.bankName,
        chequeNumber: data.chequeNumber,
        chequeDate: new Date(data.chequeDate),
        amount: data.amount,
        status: "PENDING",
        note: data.note,
        branchId: user.activeBranchId!,
        shopId: user.shopId,
        userId: user.userId,
      },
    });

    revalidatePath("/dashboard/admin/accounts");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to record cheque." };
  }
}

export async function clearChequeAction(chequeId: string, accountId: string) {
  try {
    const user = await requireAuth(["OWNER", "MANAGER", "ADMIN"]);

    const cheque = await prisma.bankCheque.findFirst({
      where: { id: chequeId, shopId: user.shopId },
    });
    if (!cheque) return { success: false, error: "Cheque not found." };
    if (cheque.status === "CLEARED") return { success: false, error: "Cheque is already cleared." };

    const account = await prisma.account.findFirst({
      where: { id: accountId, shopId: user.shopId },
    });
    if (!account) return { success: false, error: "Deposit/Withdraw account not found." };

    const amount = Number(cheque.amount);
    const voucherNo = `CHQ-${Date.now().toString().slice(-6)}`;

    await prisma.$transaction(async (tx) => {
      let newBal = Number(account.currentBalance);
      let txType: "DEPOSIT" | "WITHDRAW" = "DEPOSIT";

      if (cheque.type === "RECEIVED") {
        newBal += amount;
        txType = "DEPOSIT";
        await tx.account.update({ where: { id: accountId }, data: { currentBalance: newBal } });
      } else {
        if (newBal < amount) throw new Error("Insufficient balance in account to clear issued cheque.");
        newBal -= amount;
        txType = "WITHDRAW";
        await tx.account.update({ where: { id: accountId }, data: { currentBalance: newBal } });
      }

      await tx.accountTransaction.create({
        data: {
          type: txType,
          amount,
          balanceAfter: newBal,
          voucherNo,
          note: `Cheque Clearance (#${cheque.chequeNumber}, ${cheque.partyName})`,
          branchId: user.activeBranchId!,
          accountId,
          userId: user.userId,
        },
      });

      await tx.bankCheque.update({
        where: { id: chequeId },
        data: {
          status: "CLEARED",
          accountId,
          clearingDate: new Date(),
        },
      });
    });

    revalidatePath("/dashboard/admin/accounts");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to clear cheque." };
  }
}