"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import { getErrorMessage } from "@/lib/utils";
import { CreateWastagePayload, WastageReason } from "@/types/stock-wastage";

const STOCK_REVALIDATE_PATHS = [
  "/dashboard/admin/stock",
  "/dashboard/admin/products",
  "/dashboard/admin/reports/stocks",
  "/dashboard/admin/reports",
  "/dashboard",
];

const WASTAGE_REASONS: WastageReason[] = [
  "ROTTEN_PERISHABLE",
  "BROKEN_DAMAGED",
  "EXPIRED_NO_RETURN",
  "PEST_DAMAGE",
  "INTERNAL_STORE_USE",
  "OTHER",
];

function isWastageReason(value: unknown): value is WastageReason {
  return typeof value === "string" && (WASTAGE_REASONS as string[]).includes(value);
}

function revalidateStock() {
  for (const path of STOCK_REVALIDATE_PATHS) revalidatePath(path);
}

async function requireWastageAccess() {
  return requireAuth({
    requiredPermission: PERMISSIONS.INVENTORY_WASTAGE,
    requireActiveStatus: true,
  });
}

interface WastageLine {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  lineCost: number;
  reason: WastageReason;
}

/** Validate products belong to the shop and value losses at DB purchase cost. */
async function buildWastageLines(
  shopId: string,
  items: { productId: string; quantity: number; reason?: WastageReason }[],
  defaultReason: WastageReason
): Promise<WastageLine[]> {
  if (!items || items.length === 0) {
    throw new Error("কমপক্ষে একটি নষ্ট পণ্য নির্বাচন করুন।");
  }

  const productIds = [...new Set(items.map((item) => item.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, shopId, status: "active" },
    select: { id: true, name: true, purchasePrice: true },
  });
  const productMap = new Map(products.map((product) => [product.id, product]));
  const lineMap = new Map<string, WastageLine>();

  for (const item of items) {
    const quantity = Number(item.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error("পণ্যের পরিমাণ শূন্যের বেশি হতে হবে।");
    }
    const product = productMap.get(item.productId);
    if (!product) throw new Error("পণ্য পাওয়া যায়নি বা এই দোকানের নয়।");

    const unitCost = Number(product.purchasePrice);
    const existing = lineMap.get(item.productId);
    const totalQty = (existing?.quantity || 0) + quantity;

    lineMap.set(item.productId, {
      productId: item.productId,
      productName: product.name,
      quantity: totalQty,
      unitCost,
      lineCost: Math.round(totalQty * unitCost * 100) / 100,
      reason: isWastageReason(item.reason) ? item.reason : defaultReason,
    });
  }

  return [...lineMap.values()];
}

export async function recordStockWastageAction(payload: CreateWastagePayload) {
  try {
    const user = await requireWastageAccess();
    const { date, reason, notes, items } = payload;

    if (!isWastageReason(reason)) {
      return { success: false, error: "নষ্টের কারণ সঠিক নয়।" };
    }

    const lines = await buildWastageLines(user.shopId, items, reason);
    const totalQuantity = lines.reduce((sum, line) => sum + line.quantity, 0);
    const totalCost = Math.round(lines.reduce((sum, line) => sum + line.lineCost, 0) * 100) / 100;
    const wastageNo = `WST-${Date.now().toString().slice(-6)}`;

    await prisma.$transaction(async (tx) => {
      for (const line of lines) {
        const updated = await tx.productStock.updateMany({
          where: {
            productId: line.productId,
            branchId: user.activeBranchId,
            quantity: { gte: line.quantity },
          },
          data: { quantity: { decrement: line.quantity } },
        });
        if (updated.count === 0) {
          throw new Error(`পর্যাপ্ত স্টক নেই: ${line.productName}`);
        }
      }

      await tx.stockWastage.create({
        data: {
          wastageNo,
          date: date ? new Date(date) : new Date(),
          totalQuantity,
          totalCost,
          reason,
          notes: notes || null,
          branchId: user.activeBranchId,
          shopId: user.shopId,
          items: {
            create: lines.map((line) => ({
              productId: line.productId,
              quantity: line.quantity,
              unitCost: line.unitCost,
              lineCost: line.lineCost,
              reason: line.reason,
            })),
          },
        },
      });
    });

    revalidateStock();
    return { success: true, wastageNo };
  } catch (error) {
    console.error("Stock wastage error:", error);
    return { success: false, error: getErrorMessage(error, "নষ্ট মাল রেকর্ড করা সম্ভব হয়নি।") };
  }
}

export async function deleteStockWastageAction(id: string) {
  try {
    const user = await requireWastageAccess();

    if (user.role !== "OWNER") {
      return { success: false, error: "শুধুমাত্র মালিক এই রেকর্ড বাতিল করতে পারেন।" };
    }

    const wastage = await prisma.stockWastage.findFirst({
      where: { id, shopId: user.shopId, branchId: user.activeBranchId },
      include: { items: true },
    });

    if (!wastage) return { success: false, error: "রেকর্ড পাওয়া যায়নি।" };

    await prisma.$transaction(async (tx) => {
      for (const item of wastage.items) {
        await tx.productStock.upsert({
          where: {
            productId_branchId: {
              productId: item.productId,
              branchId: wastage.branchId,
            },
          },
          update: { quantity: { increment: item.quantity } },
          create: {
            productId: item.productId,
            branchId: wastage.branchId,
            quantity: item.quantity,
          },
        });
      }

      await tx.stockWastageItem.deleteMany({ where: { wastageId: id } });
      await tx.stockWastage.delete({ where: { id } });
    });

    revalidateStock();
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "রেকর্ড মুছে ফেলা সম্ভব হয়নি।") };
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
    const user = await requireWastageAccess();
    const { id, reason, notes, items } = payload;

    if (!isWastageReason(reason)) {
      return { success: false, error: "নষ্টের কারণ সঠিক নয়।" };
    }

    const existing = await prisma.stockWastage.findFirst({
      where: { id, shopId: user.shopId, branchId: user.activeBranchId },
      include: { items: true },
    });

    if (!existing) return { success: false, error: "রেকর্ড পাওয়া যায়নি।" };

    const lines = await buildWastageLines(user.shopId, items, reason);
    const totalQuantity = lines.reduce((sum, line) => sum + line.quantity, 0);
    const totalCost = Math.round(lines.reduce((sum, line) => sum + line.lineCost, 0) * 100) / 100;

    await prisma.$transaction(async (tx) => {
      // 1. Restore old deducted stock
      for (const old of existing.items) {
        await tx.productStock.upsert({
          where: {
            productId_branchId: {
              productId: old.productId,
              branchId: existing.branchId,
            },
          },
          update: { quantity: { increment: old.quantity } },
          create: {
            productId: old.productId,
            branchId: existing.branchId,
            quantity: old.quantity,
          },
        });
      }

      await tx.stockWastageItem.deleteMany({ where: { wastageId: id } });

      // 2. Deduct the corrected quantities with atomic stock guards
      for (const line of lines) {
        const updated = await tx.productStock.updateMany({
          where: {
            productId: line.productId,
            branchId: existing.branchId,
            quantity: { gte: line.quantity },
          },
          data: { quantity: { decrement: line.quantity } },
        });
        if (updated.count === 0) {
          throw new Error(`পর্যাপ্ত স্টক নেই: ${line.productName}`);
        }

        await tx.stockWastageItem.create({
          data: {
            wastageId: id,
            productId: line.productId,
            quantity: line.quantity,
            unitCost: line.unitCost,
            lineCost: line.lineCost,
            reason: line.reason,
          },
        });
      }

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

    revalidateStock();
    return { success: true };
  } catch (error) {
    console.error("Update wastage error:", error);
    return { success: false, error: getErrorMessage(error, "আপডেট সম্পন্ন করা সম্ভব হয়নি।") };
  }
}
