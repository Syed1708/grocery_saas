"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import { getErrorMessage } from "@/lib/utils";
import { CreateTransferPayload } from "@/types/stock-transfer";

const STOCK_REVALIDATE_PATHS = [
  "/dashboard/admin/stock",
  "/dashboard/admin/products",
  "/dashboard/admin/reports/stocks",
  "/dashboard/pos",
];

function revalidateStock() {
  for (const path of STOCK_REVALIDATE_PATHS) revalidatePath(path);
}

async function requireTransferAccess() {
  return requireAuth({
    requiredPermission: PERMISSIONS.INVENTORY_TRANSFER,
    requireActiveStatus: true,
  });
}

interface RequestedLine {
  productId: string;
  quantity: number;
}

interface TransferLine {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  lineCost: number;
}

/** Validate products belong to the shop and value them at DB purchase cost. */
async function buildTransferLines(shopId: string, items: RequestedLine[]): Promise<TransferLine[]> {
  if (!items || items.length === 0) {
    throw new Error("কমপক্ষে একটি পণ্য স্থানান্তর তালিকায় যোগ করুন।");
  }

  const productIds = [...new Set(items.map((item) => item.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, shopId, status: "active" },
    select: { id: true, name: true, purchasePrice: true },
  });
  const productMap = new Map(products.map((product) => [product.id, product]));
  const quantityMap = new Map<string, number>();

  for (const item of items) {
    const quantity = Number(item.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error("পরিমাণ অবশ্যই শূন্যের বেশি হতে হবে।");
    }
    const product = productMap.get(item.productId);
    if (!product) throw new Error("পণ্য পাওয়া যায়নি বা এই দোকানের নয়।");
    quantityMap.set(item.productId, (quantityMap.get(item.productId) || 0) + quantity);
  }

  return [...quantityMap.entries()].map(([productId, quantity]) => {
    const product = productMap.get(productId)!;
    const unitCost = Number(product.purchasePrice);
    return {
      productId,
      productName: product.name,
      quantity,
      unitCost,
      lineCost: Math.round(quantity * unitCost * 100) / 100,
    };
  });
}

// ==========================================
// 1. DISPATCH TRANSFER (SOURCE BRANCH)
// ==========================================
export async function createAndDispatchTransferAction(payload: CreateTransferPayload) {
  try {
    const user = await requireTransferAccess();
    const { toBranchId, driverName, driverPhone, vehicleNo, notes, items } = payload;

    if (!toBranchId || user.activeBranchId === toBranchId) {
      return { success: false, error: "একটি ভিন্ন গন্তব্য ব্রাঞ্চ নির্বাচন করুন।" };
    }

    const destination = await prisma.branch.findFirst({
      where: { id: toBranchId, shopId: user.shopId, status: "active" },
      select: { id: true },
    });
    if (!destination) {
      return { success: false, error: "গন্তব্য ব্রাঞ্চ পাওয়া যায়নি বা নিষ্ক্রিয়।" };
    }

    const lines = await buildTransferLines(user.shopId, items);
    const totalQuantity = lines.reduce((sum, line) => sum + line.quantity, 0);
    const totalCost = Math.round(lines.reduce((sum, line) => sum + line.lineCost, 0) * 100) / 100;
    const transferNo = `TR-${Date.now().toString().slice(-6)}`;

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

      await tx.stockTransfer.create({
        data: {
          transferNo,
          shopId: user.shopId,
          fromBranchId: user.activeBranchId,
          toBranchId,
          status: "DISPATCHED",
          totalItems: lines.length,
          totalQuantity,
          totalCost,
          driverName: driverName || null,
          driverPhone: driverPhone || null,
          vehicleNo: vehicleNo || null,
          notes: notes || null,
          items: {
            create: lines.map((line) => ({
              productId: line.productId,
              quantitySent: line.quantity,
              unitCost: line.unitCost,
              lineCost: line.lineCost,
            })),
          },
        },
      });
    });

    revalidateStock();
    return { success: true, transferNo };
  } catch (error) {
    console.error("Dispatch transfer error:", error);
    return { success: false, error: getErrorMessage(error, "স্থানান্তর সম্পন্ন করা সম্ভব হয়নি।") };
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
    const user = await requireTransferAccess();
    const { transferId, items } = payload;

    const transfer = await prisma.stockTransfer.findFirst({
      where: { id: transferId, shopId: user.shopId },
      include: { items: true },
    });

    if (!transfer) return { success: false, error: "স্থানান্তর রেকর্ড পাওয়া যায়নি।" };
    if (transfer.toBranchId !== user.activeBranchId) {
      return { success: false, error: "শুধুমাত্র গন্তব্য ব্রাঞ্চ এই চালান গ্রহণ করতে পারে।" };
    }
    if (transfer.status !== "DISPATCHED") {
      return { success: false, error: "এই চালানটি ইতোমধ্যেই গ্রহণ বা বাতিল করা হয়েছে।" };
    }

    const submitted = new Map(items.map((item) => [item.productId, item]));
    const receivedLines: {
      productId: string;
      received: number;
      damaged: number;
      unitCost: number;
      transferItemId: string;
    }[] = [];

    for (const transferItem of transfer.items) {
      const row = submitted.get(transferItem.productId);
      if (!row) {
        return { success: false, error: "সব পণ্যের গ্রহণ ও ক্ষতির পরিমাণ দিন।" };
      }

      const sent = Number(transferItem.quantitySent);
      const received = Math.max(0, Number(row.quantityReceived) || 0);
      const damaged = Math.max(0, Number(row.transitDamage) || 0);

      if (received + damaged !== sent) {
        return {
          success: false,
          error: "প্রতিটি পণ্যের ভালো + নষ্ট = পাঠানো পরিমাণ হতে হবে।",
        };
      }

      receivedLines.push({
        productId: transferItem.productId,
        received,
        damaged,
        unitCost: Number(transferItem.unitCost),
        transferItemId: transferItem.id,
      });
    }

    await prisma.$transaction(async (tx) => {
      const damagedLines: {
        productId: string;
        quantity: number;
        unitCost: number;
        lineCost: number;
        reason: "BROKEN_DAMAGED";
      }[] = [];

      for (const line of receivedLines) {
        await tx.stockTransferItem.update({
          where: { id: line.transferItemId },
          data: { quantityReceived: line.received, transitDamage: line.damaged },
        });

        if (line.received > 0) {
          await tx.productStock.upsert({
            where: {
              productId_branchId: {
                productId: line.productId,
                branchId: transfer.toBranchId,
              },
            },
            update: { quantity: { increment: line.received } },
            create: {
              productId: line.productId,
              branchId: transfer.toBranchId,
              quantity: line.received,
            },
          });
        }

        if (line.damaged > 0) {
          damagedLines.push({
            productId: line.productId,
            quantity: line.damaged,
            unitCost: line.unitCost,
            lineCost: Math.round(line.damaged * line.unitCost * 100) / 100,
            reason: "BROKEN_DAMAGED",
          });
        }
      }

      if (damagedLines.length > 0) {
        await tx.stockWastage.create({
          data: {
            wastageNo: `WST-TR-${Date.now().toString().slice(-6)}`,
            shopId: user.shopId,
            branchId: transfer.toBranchId,
            totalQuantity: damagedLines.reduce((sum, line) => sum + line.quantity, 0),
            totalCost: Math.round(damagedLines.reduce((sum, line) => sum + line.lineCost, 0) * 100) / 100,
            reason: "BROKEN_DAMAGED",
            notes: `চালান #${transfer.transferNo} এর পরিবহনজনিত ক্ষতি (Transit Damage)`,
            items: { create: damagedLines },
          },
        });
      }

      await tx.stockTransfer.update({
        where: { id: transferId },
        data: { status: "COMPLETED", receiveDate: new Date() },
      });
    });

    revalidateStock();
    return { success: true };
  } catch (error) {
    console.error("Receive transfer error:", error);
    return { success: false, error: getErrorMessage(error, "পণ্য গ্রহণ সম্পন্ন করা সম্ভব হয়নি।") };
  }
}

// ==========================================
// 3. CANCEL TRANSFER (SOURCE BRANCH ROLLBACK)
// ==========================================
export async function cancelTransferAction(transferId: string) {
  try {
    const user = await requireTransferAccess();

    const transfer = await prisma.stockTransfer.findFirst({
      where: {
        id: transferId,
        shopId: user.shopId,
        fromBranchId: user.activeBranchId,
        status: "DISPATCHED",
      },
      include: { items: true },
    });

    if (!transfer) {
      return { success: false, error: "বাতিলযোগ্য চালান পাওয়া যায়নি (শুধু প্রেরক ব্রাঞ্চ বাতিল করতে পারে)।" };
    }

    await prisma.$transaction(async (tx) => {
      for (const item of transfer.items) {
        await tx.productStock.upsert({
          where: {
            productId_branchId: {
              productId: item.productId,
              branchId: transfer.fromBranchId,
            },
          },
          update: { quantity: { increment: item.quantitySent } },
          create: {
            productId: item.productId,
            branchId: transfer.fromBranchId,
            quantity: item.quantitySent,
          },
        });
      }

      await tx.stockTransfer.update({
        where: { id: transferId },
        data: { status: "CANCELLED" },
      });
    });

    revalidateStock();
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "চালান বাতিল করা সম্ভব হয়নি।") };
  }
}

// ==========================================
// 4. UPDATE TRANSFER (DISPATCHED, SOURCE BRANCH)
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
    const user = await requireTransferAccess();
    const { id, driverName, driverPhone, vehicleNo, notes, items } = payload;

    const transfer = await prisma.stockTransfer.findFirst({
      where: {
        id,
        shopId: user.shopId,
        fromBranchId: user.activeBranchId,
        status: "DISPATCHED",
      },
      include: { items: true },
    });

    if (!transfer) {
      return { success: false, error: "সম্পাদনযোগ্য চালান পাওয়া যায়নি (শুধু প্রেরক ব্রাঞ্চ সম্পাদনা করতে পারে)।" };
    }

    const lines = await buildTransferLines(user.shopId, items);
    const totalQuantity = lines.reduce((sum, line) => sum + line.quantity, 0);
    const totalCost = Math.round(lines.reduce((sum, line) => sum + line.lineCost, 0) * 100) / 100;

    await prisma.$transaction(async (tx) => {
      // Restore old dispatched quantities to the source branch
      for (const old of transfer.items) {
        await tx.productStock.upsert({
          where: {
            productId_branchId: {
              productId: old.productId,
              branchId: transfer.fromBranchId,
            },
          },
          update: { quantity: { increment: old.quantitySent } },
          create: {
            productId: old.productId,
            branchId: transfer.fromBranchId,
            quantity: old.quantitySent,
          },
        });
      }

      await tx.stockTransferItem.deleteMany({ where: { transferId: id } });

      for (const line of lines) {
        const updated = await tx.productStock.updateMany({
          where: {
            productId: line.productId,
            branchId: transfer.fromBranchId,
            quantity: { gte: line.quantity },
          },
          data: { quantity: { decrement: line.quantity } },
        });
        if (updated.count === 0) {
          throw new Error(`পর্যাপ্ত স্টক নেই: ${line.productName}`);
        }

        await tx.stockTransferItem.create({
          data: {
            transferId: id,
            productId: line.productId,
            quantitySent: line.quantity,
            unitCost: line.unitCost,
            lineCost: line.lineCost,
          },
        });
      }

      await tx.stockTransfer.update({
        where: { id },
        data: {
          totalItems: lines.length,
          totalQuantity,
          totalCost,
          driverName: driverName || null,
          driverPhone: driverPhone || null,
          vehicleNo: vehicleNo || null,
          notes: notes || null,
        },
      });
    });

    revalidateStock();
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "চালান আপডেট করা সম্ভব হয়নি।") };
  }
}
