"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/guard";
import { partnerSchema, partnerDrawingSchema, partnerRationSchema } from "@/lib/validations/partner";

// ==========================================
// 1. CREATE PARTNER
// ==========================================
export async function createPartnerAction(formData: FormData) {
  try {
    const user = await requireAuth();
    if (user.role !== "OWNER") return { success: false, error: "Only Owner can manage Family Partners." };

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

    revalidatePath("/family-ledger");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create partner profile." };
  }
}

// ==========================================
// 2. DELETE PARTNER (Safe Guarded)
// ==========================================
export async function deletePartnerAction(id: string) {
  try {
    const user = await requireAuth();
    if (user.role !== "OWNER") return { success: false, error: "Access denied." };

    const partner = await prisma.partner.findFirst({
      where: { id, shopId: user.shopId },
      include: {
        _count: {
          select: { transactions: true, rations: true },
        },
      },
    });

    if (!partner) return { success: false, error: "Partner profile not found." };

    // Prevent deletion if partner has transaction history
    if (partner._count.transactions > 0 || partner._count.rations > 0) {
      return {
        success: false,
        error: `Cannot delete: ${partner.name} has ${partner._count.transactions} cash transactions and ${partner._count.rations} grocery ration records. Mark as Inactive instead to preserve accounting history.`,
      };
    }

    await prisma.partner.delete({ where: { id } });
    revalidatePath("/family-ledger");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete partner." };
  }
}

// ==========================================
// 3. RECORD CASH/BANK DRAWING OR INJECTION
// ==========================================
export async function recordPartnerTransactionAction(formData: FormData) {
  try {
    const user = await requireAuth();
    if (user.role !== "OWNER") return { success: false, error: "Access denied." };
    if (!user.activeBranchId) return { success: false, error: "Active branch context required." };

    const validated = partnerDrawingSchema.safeParse({
      partnerId: formData.get("partnerId")?.toString(),
      type: formData.get("type")?.toString(),
      amount: formData.get("amount"),
      accountId: formData.get("accountId")?.toString(),
      purpose: formData.get("purpose")?.toString(),
      notes: formData.get("notes")?.toString() || null,
    });

    if (!validated.success) return { success: false, error: validated.error.issues[0].message };
    const d = validated.data;

    const account = await prisma.account.findFirst({
      where: { id: d.accountId, shopId: user.shopId },
    });
    if (!account) return { success: false, error: "Account not found." };

    const voucherNo = `VCH-${d.type === "CAPITAL_INJECTION" ? "CAP" : "DRW"}-${Date.now().toString().slice(-6)}`;
    const isInjection = d.type === "CAPITAL_INJECTION";

    // Atomic Transaction: Adjust Account Balance + Record Partner Transaction
    await prisma.$transaction(async (tx) => {
      // 1. Account Balance Adjustment
      await tx.account.update({
        where: { id: d.accountId },
        data: {
          currentBalance: isInjection 
            ? { increment: d.amount }
            : { decrement: d.amount },
        },
      });

      // 2. Create Transaction Record
      await tx.partnerTransaction.create({
        data: {
          voucherNo,
          type: d.type,
          amount: d.amount,
          paymentMethod: account.type.toLowerCase(),
          purpose: d.purpose,
          notes: d.notes,
          partnerId: d.partnerId,
          accountId: d.accountId,
          branchId: user.activeBranchId,
          shopId: user.shopId,
        },
      });
    });

    revalidatePath("/family-ledger");
    revalidatePath("/accounts");
    return { success: true, voucherNo };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to record transaction." };
  }
}

// ==========================================
// 4. RECORD HOME GROCERY RATION (AT COST)
// ==========================================
export async function recordPartnerRationAction(data: { partnerId: string; notes?: string; items: { productId: string; quantity: number }[] }) {
  try {
    const user = await requireAuth();
    if (user.role !== "OWNER") return { success: false, error: "Access denied." };
    if (!user.activeBranchId) return { success: false, error: "Active branch required." };

    const validated = partnerRationSchema.safeParse(data);
    if (!validated.success) return { success: false, error: validated.error.issues[0].message };

    const rationNo = `RAT-${Date.now().toString().slice(-6)}`;

    await prisma.$transaction(async (tx) => {
      let totalCost = 0;
      const lineItemsToCreate: any[] = [];

      for (const item of validated.data.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { unit: true },
        });
        if (!product) throw new Error(`Product not found: ${item.productId}`);

        const cost = Number(product.purchasePrice);
        const lineTotal = cost * item.quantity;
        totalCost += lineTotal;

        // Atomic Stock Decrement (No phantom shrinkage!)
        await tx.productStock.update({
          where: { productId_branchId: { productId: product.id, branchId: user.activeBranchId } },
          data: { quantity: { decrement: item.quantity } },
        });

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
          totalCost,
          notes: validated.data.notes,
          partnerId: validated.data.partnerId,
          branchId: user.activeBranchId,
          shopId: user.shopId,
          items: { create: lineItemsToCreate },
        },
      });
    });

    revalidatePath("/family-ledger");
    revalidatePath("/inventory");
    return { success: true, rationNo };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to record grocery ration." };
  }
}