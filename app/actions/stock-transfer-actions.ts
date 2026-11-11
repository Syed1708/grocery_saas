"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import { CreateTransferPayload } from "@/types/stock-transfer";

// ==========================================
// 1. DISPATCH TRANSFER (SOURCE BRANCH)
// ==========================================
export async function createAndDispatchTransferAction(payload: CreateTransferPayload) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });

    if (!user.activeBranchId) {
      return { success: false, error: "সক্রিয় ব্রাঞ্চ পাওয়া যায়নি।" };
    }

    const { toBranchId, driverName, driverPhone, vehicleNo, notes, items } = payload;

    if (!toBranchId || user.activeBranchId === toBranchId) {
      return { success: false, error: "একটি ভিন্ন গন্তব্য ব্রাঞ্চ নির্বাচন করুন।" };
    }

    if (!items || items.length === 0) {
      return { success: false, error: "কমপক্ষে একটি পণ্য স্থানান্তর তালিকায় যোগ করুন।" };
    }

    const transferNo = `TR-${Date.now().toString().slice(-6)}`;
    let totalQuantity = 0;
    let totalCost = 0;

    for (const it of items) {
      const q = Number(it.quantity);
      const c = Number(it.unitCost);
      if (q <= 0) return { success: false, error: "পরিমাণ অবশ্যই শূন্যের বেশি হতে হবে।" };
      totalQuantity += q;
      totalCost += q * c;
    }

    // 🚀 ATOMIC DISPATCH TRANSACTION
    await prisma.$transaction(async (tx) => {
      // 1. Verify stock availability & decrement from Source Branch
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
            `পর্যাপ্ত স্টক নেই! বর্তমান স্টক: ${currentStock}, পাঠাতে চেয়েছেন: ${it.quantity}`
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

      // 2. Create StockTransfer Record with DISPATCHED (In-Transit) status
      await tx.stockTransfer.create({
        data: {
          transferNo,
          shopId: user.shopId,
          fromBranchId: user.activeBranchId!,
          toBranchId,
          status: "DISPATCHED",
          totalItems: items.length,
          totalQuantity,
          totalCost,
          driverName: driverName || null,
          driverPhone: driverPhone || null,
          vehicleNo: vehicleNo || null,
          notes: notes || null,
          items: {
            create: items.map((i) => ({
              productId: i.productId,
              quantitySent: i.quantity,
              unitCost: i.unitCost,
              lineCost: i.quantity * i.unitCost,
            })),
          },
        },
      });
    });

    revalidatePath("/stock");
    revalidatePath("/inventory");
    return { success: true, transferNo };
  } catch (error: any) {
    console.error("Dispatch transfer error:", error);
    return { success: false, error: error.message || "স্থানান্তর সম্পন্ন করা সম্ভব হয়নি।" };
  }
}

// ==========================================
// 2. RECEIVE TRANSFER (DESTINATION BRANCH)
// ==========================================
export async function receiveTransferAction(payload: {
  transferId: string;
  items: {
    productId: string;
    quantityReceived: number;
    transitDamage: number;
    unitCost: number;
  }[];
}) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });

    const { transferId, items } = payload;
    const transfer = await prisma.stockTransfer.findFirst({
      where: { id: transferId, shopId: user.shopId },
    });

    if (!transfer) return { success: false, error: "স্থানান্তর রেকর্ড পাওয়া যায়নি।" };
    if (transfer.status !== "DISPATCHED") {
      return { success: false, error: "এই চালানটি ইতোমধ্যেই গ্রহণ বা বাতিল করা হয়েছে।" };
    }

    // 🚀 ATOMIC RECEIVE TRANSACTION
    await prisma.$transaction(async (tx) => {
      let anyDamage = false;
      const damagedItemsToLog: any[] = [];

      for (const it of items) {
        const received = Math.max(0, Number(it.quantityReceived || 0));
        const damaged = Math.max(0, Number(it.transitDamage || 0));

        // Update transfer item record with received count & damage count
        await tx.stockTransferItem.updateMany({
          where: { transferId, productId: it.productId },
          data: {
            quantityReceived: received,
            transitDamage: damaged,
          },
        });

        // Increment stock at destination branch for good items received
        if (received > 0) {
          await tx.productStock.upsert({
            where: {
              productId_branchId: {
                productId: it.productId,
                branchId: transfer.toBranchId,
              },
            },
            update: { quantity: { increment: received } },
            create: {
              productId: it.productId,
              branchId: transfer.toBranchId,
              quantity: received,
            },
          });
        }

        // If items broke in transit, log them to Spoilage & Wastage automatically
        if (damaged > 0) {
          anyDamage = true;
          damagedItemsToLog.push({
            productId: it.productId,
            quantity: damaged,
            unitCost: it.unitCost,
            lineCost: damaged * it.unitCost,
            reason: "BROKEN_DAMAGED",
          });
        }
      }

      // Auto-log transit breakage into StockWastage
      if (anyDamage && damagedItemsToLog.length > 0) {
        const totalWastageCost = damagedItemsToLog.reduce((s, d) => s + d.lineCost, 0);
        const totalWastageQty = damagedItemsToLog.reduce((s, d) => s + d.quantity, 0);

        await tx.stockWastage.create({
          data: {
            wastageNo: `WST-TR-${Date.now().toString().slice(-6)}`,
            shopId: user.shopId,
            branchId: transfer.toBranchId,
            totalQuantity: totalWastageQty,
            totalCost: totalWastageCost,
            reason: "BROKEN_DAMAGED",
            notes: `চালান #${transfer.transferNo} এর পরিবহনজনিত ক্ষতি (Transit Damage)`,
            items: {
              create: damagedItemsToLog,
            },
          },
        });
      }

      // Mark transfer as COMPLETED
      await tx.stockTransfer.update({
        where: { id: transferId },
        data: {
          status: "COMPLETED",
          receiveDate: new Date(),
        },
      });
    });

    revalidatePath("/stock");
    revalidatePath("/inventory");
    return { success: true };
  } catch (error: any) {
    console.error("Receive transfer error:", error);
    return { success: false, error: error.message || "পণ্য গ্রহণ সম্পন্ন করা সম্ভব হয়নি।" };
  }
}

// ==========================================
// 3. CANCEL TRANSFER (ROLLBACK TO SOURCE)
// ==========================================
export async function cancelTransferAction(transferId: string) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });

    const transfer = await prisma.stockTransfer.findFirst({
      where: { id: transferId, shopId: user.shopId },
      include: { items: true },
    });

    if (!transfer) return { success: false, error: "রেকর্ড পাওয়া যায়নি।" };
    if (transfer.status !== "DISPATCHED") {
      return { success: false, error: "গ্রহণকৃত চালান বাতিল করা সম্ভব নয়।" };
    }

    // Atomic Rollback back to Source Branch
    await prisma.$transaction(async (tx) => {
      for (const it of transfer.items) {
        await tx.productStock.updateMany({
          where: { productId: it.productId, branchId: transfer.fromBranchId },
          data: { quantity: { increment: it.quantitySent } },
        });
      }

      await tx.stockTransfer.update({
        where: { id: transferId },
        data: { status: "CANCELLED" },
      });
    });

    revalidatePath("/stock");
    revalidatePath("/inventory");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==========================================
// 4. UPDATE TRANSFER (DISPATCHED ONLY)
// ==========================================
export async function updateTransferAction(payload: {
  id: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNo?: string;
  notes?: string;
  items: { productId: string; quantity: number; unitCost: number }[];
}) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });

    const { id, driverName, driverPhone, vehicleNo, notes, items } = payload;
    const transfer = await prisma.stockTransfer.findFirst({
      where: { id, shopId: user.shopId },
      include: { items: true },
    });

    if (!transfer) return { success: false, error: "চালান পাওয়া যায়নি।" };
    if (transfer.status !== "DISPATCHED") {
      return { success: false, error: "গ্রহণকৃত বা বাতিল চালান সম্পাদনা করা সম্ভব নয়।" };
    }

    let totalQuantity = 0;
    let totalCost = 0;
    for (const it of items) {
      totalQuantity += Number(it.quantity);
      totalCost += Number(it.quantity) * Number(it.unitCost);
    }

    await prisma.$transaction(async (tx) => {
      // 1. Revert previous stock deduction back to Source Branch
      for (const old of transfer.items) {
        await tx.productStock.updateMany({
          where: { productId: old.productId, branchId: transfer.fromBranchId },
          data: { quantity: { increment: old.quantitySent } },
        });
      }

      // 2. Delete old transfer items
      await tx.stockTransferItem.deleteMany({ where: { transferId: id } });

      // 3. Deduct new items from Source Branch
      for (const it of items) {
        const stockRecord = await tx.productStock.findUnique({
          where: {
            productId_branchId: { productId: it.productId, branchId: transfer.fromBranchId },
          },
        });

        const currentStock = Number(stockRecord?.quantity || 0);
        if (currentStock < it.quantity) {
          throw new Error(`পর্যাপ্ত স্টক নেই! বর্তমান স্টক: ${currentStock}, পাঠাতে চেয়েছেন: ${it.quantity}`);
        }

        await tx.productStock.update({
          where: {
            productId_branchId: { productId: it.productId, branchId: transfer.fromBranchId },
          },
          data: { quantity: { decrement: it.quantity } },
        });

        await tx.stockTransferItem.create({
          data: {
            transferId: id,
            productId: it.productId,
            quantitySent: it.quantity,
            unitCost: it.unitCost,
            lineCost: it.quantity * it.unitCost,
          },
        });
      }

      // 4. Update master transfer record
      await tx.stockTransfer.update({
        where: { id },
        data: {
          totalItems: items.length,
          totalQuantity,
          totalCost,
          driverName: driverName || null,
          driverPhone: driverPhone || null,
          vehicleNo: vehicleNo || null,
          notes: notes || null,
        },
      });
    });

    revalidatePath("/stock");
    revalidatePath("/inventory");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}