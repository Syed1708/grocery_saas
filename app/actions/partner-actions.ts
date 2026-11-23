"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import { getErrorMessage } from "@/lib/utils";
import { partnerSchema, partnerDrawingSchema, partnerRationSchema } from "@/lib/validations/partner";

const FAMILY_REVALIDATE_PATHS = [
  "/dashboard/familyledger",
  "/dashboard/admin/accounts",
  "/dashboard/admin/products",
  "/dashboard/admin/reports/family",
  "/dashboard/admin/reports/stocks",
];

function revalidateFamily() {
  for (const path of FAMILY_REVALIDATE_PATHS) revalidatePath(path);
}

async function requireFamilyAccess() {
  return requireAuth({
    requiredPermission: PERMISSIONS.FAMILY_LEDGER_ACCESS,
    requireActiveStatus: true,
  });
}

// ==========================================
// 1. CREATE PARTNER
// ==========================================
export async function createPartnerAction(formData: FormData) {
  try {
    const user = await requireFamilyAccess();

    const validated = partnerSchema.safeParse({
      name: formData.get("name")?.toString().trim(),
      relationship: formData.get("relationship")?.toString(),
      phone: formData.get("phone")?.toString().trim() || null,
      nidNumber: formData.get("nidNumber")?.toString().trim() || null,
      equityPercent: formData.get("equityPercent") || 0,
      openingCapital: formData.get("openingCapital") || 0,
      monthlyAllowance: formData.get("monthlyAllowance") || 0,
      notes: formData.get("notes")?.toString() || null,
    });

    if (!validated.success) return { success: false, error: validated.error.issues[0].message };
    const d = validated.data;

    const duplicate = await prisma.partner.findFirst({
      where: { shopId: user.shopId, name: d.name },
      select: { id: true },
    });
    if (duplicate) {
      return { success: false, error: `"${d.name}" নামে একটি পার্টনার ইতোমধ্যে আছে।` };
    }

    await prisma.partner.create({
      data: {
        name: d.name,
        relationship: d.relationship,
        phone: d.phone,
        nidNumber: d.nidNumber,
        equityPercent: d.equityPercent,
        openingCapital: d.openingCapital,
        currentBalance: d.openingCapital,
        monthlyAllowance: d.monthlyAllowance,
        notes: d.notes,
        shopId: user.shopId,
      },
    });

    revalidateFamily();
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Failed to create partner profile.") };
  }
}

// ==========================================
// 2. UPDATE PARTNER
// ==========================================
export async function updatePartnerAction(formData: FormData) {
  try {
    const user = await requireFamilyAccess();

    const id = formData.get("id")?.toString();
    if (!id) return { success: false, error: "Partner id is required." };

    const validated = partnerSchema.safeParse({
      id,
      name: formData.get("name")?.toString().trim(),
      relationship: formData.get("relationship")?.toString(),
      phone: formData.get("phone")?.toString().trim() || null,
      nidNumber: formData.get("nidNumber")?.toString().trim() || null,
      equityPercent: formData.get("equityPercent") || 0,
      openingCapital: formData.get("openingCapital") || 0,
      monthlyAllowance: formData.get("monthlyAllowance") || 0,
      notes: formData.get("notes")?.toString() || null,
    });

    if (!validated.success) return { success: false, error: validated.error.issues[0].message };
    const d = validated.data;

    const existing = await prisma.partner.findFirst({
      where: { id, shopId: user.shopId },
      select: { id: true },
    });
    if (!existing) return { success: false, error: "Partner profile not found." };

    await prisma.partner.update({
      where: { id },
      data: {
        name: d.name,
        relationship: d.relationship,
        phone: d.phone,
        nidNumber: d.nidNumber,
        equityPercent: d.equityPercent,
        openingCapital: d.openingCapital,
        monthlyAllowance: d.monthlyAllowance,
        notes: d.notes,
      },
    });

    revalidateFamily();
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Failed to update partner profile.") };
  }
}

// ==========================================
// 3. DELETE PARTNER (Safe Guarded)
// ==========================================
export async function deletePartnerAction(id: string) {
  try {
    const user = await requireFamilyAccess();

    const partner = await prisma.partner.findFirst({
      where: { id, shopId: user.shopId },
      include: {
        _count: { select: { transactions: true, rations: true } },
      },
    });

    if (!partner) return { success: false, error: "Partner profile not found." };

    if (partner._count.transactions > 0 || partner._count.rations > 0) {
      return {
        success: false,
        error: `Cannot delete: ${partner.name} has ${partner._count.transactions} cash transactions and ${partner._count.rations} grocery ration records. Mark as inactive to preserve history.`,
      };
    }

    await prisma.partner.delete({ where: { id } });
    revalidateFamily();
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Failed to delete partner.") };
  }
}

// ==========================================
// 4. RECORD CASH/BANK DRAWING OR CAPITAL INJECTION
// ==========================================
export async function recordPartnerTransactionAction(formData: FormData) {
  try {
    const user = await requireFamilyAccess();
    if (!user.activeBranchId) return { success: false, error: "Active branch context required." };

    const validated = partnerDrawingSchema.safeParse({
      partnerId: formData.get("partnerId")?.toString(),
      type: formData.get("type")?.toString(),
      amount: formData.get("amount"),
      accountId: formData.get("accountId")?.toString(),
      purpose: formData.get("purpose")?.toString(),
      transactionDate: formData.get("transactionDate")?.toString() || undefined,
      notes: formData.get("notes")?.toString() || null,
    });

    if (!validated.success) return { success: false, error: validated.error.issues[0].message };
    const d = validated.data;

    const partner = await prisma.partner.findFirst({
      where: { id: d.partnerId, shopId: user.shopId, status: "active" },
      select: { id: true },
    });
    if (!partner) return { success: false, error: "Partner not found in this shop." };

    const account = await prisma.account.findFirst({
      where: {
        id: d.accountId,
        shopId: user.shopId,
        branchId: user.activeBranchId,
        status: "active",
      },
      select: { id: true, type: true, currentBalance: true },
    });
    if (!account) return { success: false, error: "Account not found in this branch." };

    const isInjection = d.type === "CAPITAL_INJECTION";
    const currentBalance = Number(account.currentBalance);

    if (!isInjection && currentBalance < d.amount) {
      return {
        success: false,
        error: `অপর্যাপ্ত ব্যালেন্স: ${account.type} অ্যাকাউন্টে আছে ৳${currentBalance.toFixed(2)}।`,
      };
    }

    const voucherNo = `VCH-${isInjection ? "CAP" : "DRW"}-${Date.now().toString().slice(-6)}`;
    const transactionDate = d.transactionDate ? new Date(d.transactionDate) : new Date();
    const newBalance = isInjection ? currentBalance + d.amount : currentBalance - d.amount;
    const paymentMethod = account.type.toLowerCase();

    await prisma.$transaction(async (tx) => {
      await tx.account.update({
        where: { id: d.accountId },
        data: isInjection
          ? { currentBalance: { increment: d.amount } }
          : { currentBalance: { decrement: d.amount } },
      });

      const partnerTx = await tx.partnerTransaction.create({
        data: {
          voucherNo,
          type: d.type,
          amount: d.amount,
          transactionDate,
          paymentMethod,
          purpose: d.purpose,
          notes: d.notes,
          partnerId: d.partnerId,
          accountId: d.accountId,
          branchId: user.activeBranchId,
          shopId: user.shopId,
        },
      });

      await tx.accountTransaction.create({
        data: {
          type: isInjection ? "DEPOSIT" : "WITHDRAW",
          amount: d.amount,
          balanceAfter: newBalance,
          transactionDate,
          referenceType: "PARTNER",
          referenceId: partnerTx.id,
          voucherNo,
          note: `Family ${isInjection ? "capital injection" : "drawing"}: ${d.purpose}`,
          branchId: user.activeBranchId,
          accountId: d.accountId,
          userId: user.userId,
        },
      });
    });

    revalidateFamily();
    return { success: true, voucherNo };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Failed to record transaction.") };
  }
}

// ==========================================
// 5. RECORD HOME GROCERY RATION (AT COST)
// ==========================================
export async function recordPartnerRationAction(data: {
  partnerId: string;
  notes?: string;
  items: { productId: string; quantity: number }[];
}) {
  try {
    const user = await requireFamilyAccess();
    if (!user.activeBranchId) return { success: false, error: "Active branch required." };

    const validated = partnerRationSchema.safeParse(data);
    if (!validated.success) return { success: false, error: validated.error.issues[0].message };

    const partner = await prisma.partner.findFirst({
      where: { id: validated.data.partnerId, shopId: user.shopId, status: "active" },
      select: { id: true },
    });
    if (!partner) return { success: false, error: "Partner not found in this shop." };

    const rationNo = `RAT-${Date.now().toString().slice(-6)}`;

    await prisma.$transaction(async (tx) => {
      let totalCost = 0;
      const lineItemsToCreate: {
        productId: string;
        unitId: string | null;
        quantity: number;
        unitCost: number;
        lineTotal: number;
      }[] = [];

      for (const item of validated.data.items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, shopId: user.shopId, status: "active" },
          include: { unit: true },
        });
        if (!product) throw new Error(`Product not found: ${item.productId}`);

        const stockUpdate = await tx.productStock.updateMany({
          where: {
            productId: product.id,
            branchId: user.activeBranchId,
            quantity: { gte: item.quantity },
          },
          data: { quantity: { decrement: item.quantity } },
        });

        if (stockUpdate.count === 0) {
          const stock = await tx.productStock.findUnique({
            where: { productId_branchId: { productId: product.id, branchId: user.activeBranchId } },
            select: { quantity: true },
          });
          throw new Error(
            `স্টক পর্যাপ্ত নয়: ${product.name} (বর্তমান: ${Number(stock?.quantity || 0)})`
          );
        }

        const cost = Number(product.purchasePrice);
        const lineTotal = Math.round(cost * item.quantity * 100) / 100;
        totalCost += lineTotal;

        lineItemsToCreate.push({
          productId: product.id,
          unitId: product.unitId,
          quantity: item.quantity,
          unitCost: cost,
          lineTotal,
        });
      }

      await tx.partnerRation.create({
        data: {
          rationNo,
          totalCost: Math.round(totalCost * 100) / 100,
          notes: validated.data.notes,
          partnerId: validated.data.partnerId,
          branchId: user.activeBranchId,
          shopId: user.shopId,
          items: { create: lineItemsToCreate },
        },
      });
    });

    revalidateFamily();
    return { success: true, rationNo };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Failed to record grocery ration.") };
  }
}

// ==========================================
// 6. EDIT / DELETE PARTNER TRANSACTIONS
// ==========================================

interface PartnerTxRow {
  id: string;
  accountId: string | null;
  type: string;
  amount: unknown;
  voucherNo: string;
  branchId: string;
}

async function reversePartnerAccountEffect(
  tx: Prisma.TransactionClient,
  userId: string,
  row: PartnerTxRow
) {
  if (!row.accountId) return;

  const account = await tx.account.findUnique({
    where: { id: row.accountId },
    select: { currentBalance: true },
  });
  if (!account) return;

  const amount = Number(row.amount);
  const wasOutgoing = row.type !== "CAPITAL_INJECTION";
  const newBalance = wasOutgoing
    ? Number(account.currentBalance) + amount
    : Number(account.currentBalance) - amount;

  await tx.account.update({
    where: { id: row.accountId },
    data: { currentBalance: newBalance },
  });

  await tx.accountTransaction.create({
    data: {
      type: wasOutgoing ? "DEPOSIT" : "WITHDRAW",
      amount,
      balanceAfter: newBalance,
      referenceType: "PARTNER_REVERSAL",
      referenceId: row.id,
      voucherNo: row.voucherNo,
      note: `Reversal: family ${wasOutgoing ? "drawing" : "capital injection"}`,
      branchId: row.branchId,
      accountId: row.accountId,
      userId,
    },
  });

  await tx.accountTransaction.deleteMany({
    where: { referenceType: "PARTNER", referenceId: row.id },
  });
}

export async function updatePartnerTransactionAction(formData: FormData) {
  try {
    const user = await requireFamilyAccess();
    if (!user.activeBranchId) return { success: false, error: "Active branch context required." };

    const id = formData.get("id")?.toString();
    if (!id) return { success: false, error: "Transaction id is required." };

    const validated = partnerDrawingSchema.safeParse({
      partnerId: formData.get("partnerId")?.toString(),
      type: formData.get("type")?.toString(),
      amount: formData.get("amount"),
      accountId: formData.get("accountId")?.toString(),
      purpose: formData.get("purpose")?.toString(),
      transactionDate: formData.get("transactionDate")?.toString() || undefined,
      notes: formData.get("notes")?.toString() || null,
    });

    if (!validated.success) return { success: false, error: validated.error.issues[0].message };
    const d = validated.data;

    const existing = await prisma.partnerTransaction.findFirst({
      where: { id, shopId: user.shopId, branchId: user.activeBranchId },
    });
    if (!existing) return { success: false, error: "Transaction not found in this branch." };

    const partner = await prisma.partner.findFirst({
      where: { id: d.partnerId, shopId: user.shopId, status: "active" },
      select: { id: true },
    });
    if (!partner) return { success: false, error: "Partner not found in this shop." };

    const account = await prisma.account.findFirst({
      where: {
        id: d.accountId,
        shopId: user.shopId,
        branchId: user.activeBranchId,
        status: "active",
      },
      select: { id: true, type: true, currentBalance: true },
    });
    if (!account) return { success: false, error: "Account not found in this branch." };

    const isInjection = d.type === "CAPITAL_INJECTION";
    const transactionDate = d.transactionDate ? new Date(d.transactionDate) : existing.transactionDate;
    const paymentMethod = account.type.toLowerCase();

    await prisma.$transaction(async (tx) => {
      await reversePartnerAccountEffect(tx, user.userId, {
        id: existing.id,
        accountId: existing.accountId,
        type: existing.type,
        amount: existing.amount,
        voucherNo: existing.voucherNo,
        branchId: existing.branchId,
      });

      const refreshedAccount = await tx.account.findUnique({
        where: { id: d.accountId },
        select: { currentBalance: true },
      });
      if (!refreshedAccount) throw new Error("Account not found.");

      const currentBalance = Number(refreshedAccount.currentBalance);
      if (!isInjection && currentBalance < d.amount) {
        throw new Error(
          `অপর্যাপ্ত ব্যালেন্স: ${account.type} অ্যাকাউন্টে আছে ৳${currentBalance.toFixed(2)}।`
        );
      }

      const newBalance = isInjection ? currentBalance + d.amount : currentBalance - d.amount;

      await tx.account.update({
        where: { id: d.accountId },
        data: isInjection
          ? { currentBalance: { increment: d.amount } }
          : { currentBalance: { decrement: d.amount } },
      });

      await tx.partnerTransaction.update({
        where: { id },
        data: {
          type: d.type,
          amount: d.amount,
          transactionDate,
          paymentMethod,
          purpose: d.purpose,
          notes: d.notes,
          partnerId: d.partnerId,
          accountId: d.accountId,
          branchId: user.activeBranchId,
        },
      });

      await tx.accountTransaction.create({
        data: {
          type: isInjection ? "DEPOSIT" : "WITHDRAW",
          amount: d.amount,
          balanceAfter: newBalance,
          transactionDate,
          referenceType: "PARTNER",
          referenceId: id,
          voucherNo: existing.voucherNo,
          note: `Family ${isInjection ? "capital injection" : "drawing"}: ${d.purpose}`,
          branchId: user.activeBranchId,
          accountId: d.accountId,
          userId: user.userId,
        },
      });
    });

    revalidateFamily();
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Failed to update transaction.") };
  }
}

export async function deletePartnerTransactionAction(id: string) {
  try {
    const user = await requireFamilyAccess();
    if (!user.activeBranchId) return { success: false, error: "Active branch context required." };

    const existing = await prisma.partnerTransaction.findFirst({
      where: { id, shopId: user.shopId, branchId: user.activeBranchId },
    });
    if (!existing) return { success: false, error: "Transaction not found." };

    await prisma.$transaction(async (tx) => {
      await reversePartnerAccountEffect(tx, user.userId, {
        id: existing.id,
        accountId: existing.accountId,
        type: existing.type,
        amount: existing.amount,
        voucherNo: existing.voucherNo,
        branchId: existing.branchId,
      });
      await tx.partnerTransaction.delete({ where: { id } });
    });

    revalidateFamily();
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Failed to delete transaction.") };
  }
}

// ==========================================
// 7. EDIT / DELETE HOME GROCERY RATIONS
// ==========================================

export async function updatePartnerRationAction(
  id: string,
  data: { partnerId: string; notes?: string; items: { productId: string; quantity: number }[] }
) {
  try {
    const user = await requireFamilyAccess();
    if (!user.activeBranchId) return { success: false, error: "Active branch required." };

    const validated = partnerRationSchema.safeParse(data);
    if (!validated.success) return { success: false, error: validated.error.issues[0].message };

    const existing = await prisma.partnerRation.findFirst({
      where: { id, shopId: user.shopId, branchId: user.activeBranchId },
      include: { items: true },
    });
    if (!existing) return { success: false, error: "Ration not found in this branch." };

    const partner = await prisma.partner.findFirst({
      where: { id: validated.data.partnerId, shopId: user.shopId, status: "active" },
      select: { id: true },
    });
    if (!partner) return { success: false, error: "Partner not found in this shop." };

    await prisma.$transaction(async (tx) => {
      // Restore old items to stock first
      for (const oldItem of existing.items) {
        await tx.productStock.upsert({
          where: {
            productId_branchId: {
              productId: oldItem.productId,
              branchId: user.activeBranchId,
            },
          },
          update: { quantity: { increment: oldItem.quantity } },
          create: {
            productId: oldItem.productId,
            branchId: user.activeBranchId,
            quantity: oldItem.quantity,
          },
        });
      }

      let totalCost = 0;
      const lineItemsToCreate: {
        productId: string;
        unitId: string | null;
        quantity: number;
        unitCost: number;
        lineTotal: number;
      }[] = [];

      for (const item of validated.data.items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, shopId: user.shopId, status: "active" },
          include: { unit: true },
        });
        if (!product) throw new Error(`Product not found: ${item.productId}`);

        const stockUpdate = await tx.productStock.updateMany({
          where: {
            productId: product.id,
            branchId: user.activeBranchId,
            quantity: { gte: item.quantity },
          },
          data: { quantity: { decrement: item.quantity } },
        });

        if (stockUpdate.count === 0) {
          const stock = await tx.productStock.findUnique({
            where: { productId_branchId: { productId: product.id, branchId: user.activeBranchId } },
            select: { quantity: true },
          });
          throw new Error(
            `স্টক পর্যাপ্ত নয়: ${product.name} (বর্তমান: ${Number(stock?.quantity || 0)})`
          );
        }

        const cost = Number(product.purchasePrice);
        const lineTotal = Math.round(cost * item.quantity * 100) / 100;
        totalCost += lineTotal;

        lineItemsToCreate.push({
          productId: product.id,
          unitId: product.unitId,
          quantity: item.quantity,
          unitCost: cost,
          lineTotal,
        });
      }

      await tx.partnerRation.update({
        where: { id },
        data: {
          partnerId: validated.data.partnerId,
          totalCost: Math.round(totalCost * 100) / 100,
          notes: validated.data.notes,
          branchId: user.activeBranchId,
          items: {
            deleteMany: {},
            create: lineItemsToCreate,
          },
        },
      });
    });

    revalidateFamily();
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Failed to update grocery ration.") };
  }
}

export async function deletePartnerRationAction(id: string) {
  try {
    const user = await requireFamilyAccess();
    if (!user.activeBranchId) return { success: false, error: "Active branch required." };

    const existing = await prisma.partnerRation.findFirst({
      where: { id, shopId: user.shopId, branchId: user.activeBranchId },
      include: { items: true },
    });
    if (!existing) return { success: false, error: "Ration not found." };

    await prisma.$transaction(async (tx) => {
      for (const item of existing.items) {
        await tx.productStock.upsert({
          where: {
            productId_branchId: {
              productId: item.productId,
              branchId: user.activeBranchId,
            },
          },
          update: { quantity: { increment: item.quantity } },
          create: {
            productId: item.productId,
            branchId: user.activeBranchId,
            quantity: item.quantity,
          },
        });
      }
      await tx.partnerRation.delete({ where: { id } });
    });

    revalidateFamily();
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Failed to delete grocery ration.") };
  }
}
