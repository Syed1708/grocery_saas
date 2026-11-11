"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import { CreateWastagePayload, WastageReason } from "@/types/stock-wastage";

export async function recordStockWastageAction(payload: CreateWastagePayload) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });

    if (!user.activeBranchId) {
      return { success: false, error: "সক্রিয় ব্রাঞ্চ পাওয়া যায়নি।" };
    }

    const { date, reason, notes, items } = payload;
    if (!items || items.length === 0) {
      return { success: false, error: "কমপক্ষে একটি নষ্ট পণ্য নির্বাচন করুন।" };
    }

    let totalQuantity = 0;
    let totalCost = 0;

    for (const it of items) {
      const q = Number(it.quantity);
      const c = Number(it.unitCost);
      if (q <= 0) return { success: false, error: "পণ্যের পরিমাণ শূন্যের বেশি হতে হবে।" };
      totalQuantity += q;
      totalCost += q * c;
    }

    const wastageNo = `WST-${Date.now().toString().slice(-6)}`;

    // 🚀 ATOMIC DATABASE TRANSACTION (Cash Drawer is NOT touched!)
    await prisma.$transaction(async (tx) => {
      // 1. Verify stock availability & decrement for active branch
      for (const it of items) {
        const stockRecord = await tx.productStock.findUnique({
          where: {
            productId_branchId: {
              productId: it.productId,
              branchId: user.activeBranchId!,
            },
          },
        });

        const currentStock = Number(stockRecord?.quantity || 0);
        if (currentStock < it.quantity) {
          throw new Error(
            `পর্যাপ্ত স্টক নেই! বর্তমান স্টক: ${currentStock}, নষ্ট হিসেবে লিখতে চেয়েছেন: ${it.quantity}`
          );
        }

        await tx.productStock.update({
          where: {
            productId_branchId: {
              productId: it.productId,
              branchId: user.activeBranchId!,
            },
          },
          data: { quantity: { decrement: it.quantity } },
        });
      }

      // 2. Create Stock Wastage Record
      await tx.stockWastage.create({
        data: {
          wastageNo,
          date: date ? new Date(date) : new Date(),
          totalQuantity,
          totalCost,
          reason,
          notes: notes || null,
          branchId: user.activeBranchId!,
          shopId: user.shopId,
          items: {
            create: items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              unitCost: i.unitCost,
              lineCost: i.quantity * i.unitCost,
              reason: i.reason || reason,
            })),
          },
        },
      });
    });

    revalidatePath("/stock");
    revalidatePath("/inventory");
    revalidatePath("/reports");
    return { success: true, wastageNo };
  } catch (error: any) {
    console.error("Stock wastage error:", error);
    return { success: false, error: error.message || "নষ্ট মাল রেকর্ড করা সম্ভব হয়নি।" };
  }
}

export async function deleteStockWastageAction(id: string) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });

    if (user.role !== "OWNER") {
      return { success: false, error: "শুধুমাত্র মালিক এই রেকর্ড বাতিল করতে পারেন।" };
    }

    const wastage = await prisma.stockWastage.findFirst({
      where: { id, shopId: user.shopId },
      include: { items: true },
    });

    if (!wastage) return { success: false, error: "রেকর্ড পাওয়া যায়নি।" };

    // Atomic Rollback: Revert stock back to shelves
    await prisma.$transaction(async (tx) => {
      for (const it of wastage.items) {
        await tx.productStock.updateMany({
          where: { productId: it.productId, branchId: wastage.branchId },
          data: { quantity: { increment: it.quantity } },
        });
      }

      await tx.stockWastageItem.deleteMany({ where: { wastageId: id } });
      await tx.stockWastage.delete({ where: { id } });
    });

    revalidatePath("/stock");
    revalidatePath("/inventory");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==========================================
// UPDATE STOCK WASTAGE (ATOMIC STOCK ROLLBACK & RE-APPLY)
// ==========================================
export async function updateStockWastageAction(payload: {
  id: string;
  reason: WastageReason;
  notes?: string;
  items: {
    productId: string;
    quantity: number;
    unitCost: number;
    reason?: WastageReason;
  }[];
}) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });

    const { id, reason, notes, items } = payload;
    if (!items || items.length === 0) {
      return { success: false, error: "কমপক্ষে একটি নষ্ট পণ্য থাকতে হবে।" };
    }

    const existing = await prisma.stockWastage.findFirst({
      where: { id, shopId: user.shopId },
      include: { items: true },
    });

    if (!existing) return { success: false, error: "রেকর্ড পাওয়া যায়নি।" };

    const branchId = existing.branchId;

    // Calculate new totals
    let totalQuantity = 0;
    let totalCost = 0;

    for (const it of items) {
      const q = Number(it.quantity);
      const c = Number(it.unitCost);
      if (q <= 0) return { success: false, error: "পণ্যের পরিমাণ শূন্যের বেশি হতে হবে।" };
      totalQuantity += q;
      totalCost += q * c;
    }

    // 🚀 ATOMIC DATABASE TRANSACTION
    await prisma.$transaction(async (tx) => {
      // 1. Revert previous stock deduction (add back to shelf)
      for (const old of existing.items) {
        await tx.productStock.updateMany({
          where: { productId: old.productId, branchId },
          data: { quantity: { increment: old.quantity } },
        });
      }

      // 2. Delete old line items
      await tx.stockWastageItem.deleteMany({ where: { wastageId: id } });

      // 3. Check availability & deduct new quantities
      for (const it of items) {
        const stockRecord = await tx.productStock.findUnique({
          where: {
            productId_branchId: { productId: it.productId, branchId },
          },
        });

        const currentStock = Number(stockRecord?.quantity || 0);
        if (currentStock < it.quantity) {
          throw new Error(
            `পর্যাপ্ত স্টক নেই! বর্তমান স্টক: ${currentStock}, নতুন নষ্ট পরিমাণ: ${it.quantity}`
          );
        }

        await tx.productStock.update({
          where: {
            productId_branchId: { productId: it.productId, branchId },
          },
          data: { quantity: { decrement: it.quantity } },
        });

        await tx.stockWastageItem.create({
          data: {
            wastageId: id,
            productId: it.productId,
            quantity: it.quantity,
            unitCost: it.unitCost,
            lineCost: it.quantity * it.unitCost,
            reason: it.reason || reason,
          },
        });
      }

      // 4. Update master wastage record
      await tx.stockWastage.update({
        where: { id },
        data: {
          totalQuantity,
          totalCost,
          reason,
          notes: notes || null,
        },
      });
    });

    revalidatePath("/stock");
    revalidatePath("/inventory");
    revalidatePath("/reports");
    return { success: true };
  } catch (error: any) {
    console.error("Update wastage error:", error);
    return { success: false, error: error.message || "আপডেট সম্পন্ন করা সম্ভব হয়নি।" };
  }
}