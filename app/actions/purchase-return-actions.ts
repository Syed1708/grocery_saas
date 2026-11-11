"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import { CreatePurchaseReturnPayload } from "@/types/purchase-return";

// ==========================================
// 1. CREATE PURCHASE RETURN (DEBIT NOTE)
// ==========================================
export async function createPurchaseReturnAction(payload: CreatePurchaseReturnPayload) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });

    if (!user.activeBranchId) {
      return { success: false, error: "সক্রিয় ব্রাঞ্চ পাওয়া যায়নি।" };
    }

    const {
      supplierId,
      purchaseId,
      returnDate,
      settlementType = "DUE_DEDUCTION",
      paymentMethod = "cash",
      refundAmount = 0,
      notes,
      items,
    } = payload;

    if (!supplierId || !items || items.length === 0) {
      return { success: false, error: "সাপ্লায়ার এবং কমপক্ষে একটি ফেরত পণ্য নির্বাচন করুন।" };
    }

    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, shopId: user.shopId },
    });
    if (!supplier) return { success: false, error: "সরবরাহকারী খুঁজে পাওয়া যায়নি।" };

    // Calculate Return Totals
    let totalAmount = 0;
    let totalQuantity = 0;

    for (const item of items) {
      const qty = Number(item.quantity);
      const cost = Number(item.unitCost);
      if (qty <= 0 || cost <= 0) {
        return { success: false, error: "ফেরতের পরিমাণ এবং মূল্য অবশ্যই শূন্যের বেশি হতে হবে।" };
      }
      totalAmount += qty * cost;
      totalQuantity += qty;
    }

    const sRefundAmount = Math.max(0, Number(refundAmount) || 0);
    if (sRefundAmount > totalAmount) {
      return { success: false, error: "নগদ রিফান্ডের পরিমাণ মোট ফেরত মূল্যের চেয়ে বেশি হতে পারে না।" };
    }

    const dueDeduction = Math.max(0, totalAmount - sRefundAmount);
    const returnNo = `PR-${Date.now().toString().slice(-6)}`;

    // 🚀 ATOMIC DATABASE TRANSACTION
    await prisma.$transaction(async (tx) => {
      // 1. Check stock availability & decrement for active branch
      for (const item of items) {
        const stockRecord = await tx.productStock.findUnique({
          where: {
            productId_branchId: {
              productId: item.productId,
              branchId: user.activeBranchId!,
            },
          },
        });

        const currentAvailable = Number(stockRecord?.quantity || 0);
        if (currentAvailable < item.quantity) {
          throw new Error(
            `পণ্যটির পর্যাপ্ত স্টক নেই (বর্তমান স্টক: ${currentAvailable}, ফেরত দিতে চান: ${item.quantity})`
          );
        }

        await tx.productStock.update({
          where: {
            productId_branchId: {
              productId: item.productId,
              branchId: user.activeBranchId!,
            },
          },
          data: { quantity: { decrement: item.quantity } },
        });
      }

      // 2. Create the Purchase Return Bill (Debit Note)
      const purchaseReturn = await tx.purchaseReturn.create({
        data: {
          returnNo,
          returnDate: returnDate ? new Date(returnDate) : new Date(),
          totalQuantity,
          totalAmount,
          refundAmount: sRefundAmount,
          dueDeduction,
          settlementType,
          paymentMethod: sRefundAmount > 0 ? paymentMethod : null,
          notes: notes || null,
          supplierId,
          purchaseId: purchaseId || null,
          branchId: user.activeBranchId!,
          shopId: user.shopId,
        },
      });

      // 3. Create Return Line Items
      for (const item of items) {
        await tx.purchaseReturnItem.create({
          data: {
            returnId: purchaseReturn.id,
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            lineTotal: item.quantity * item.unitCost,
            reason: item.reason,
          },
        });
      }

      // 4. Update Supplier Current Due (Bakir Khata Deduction)
      if (dueDeduction > 0) {
        await tx.supplier.update({
          where: { id: supplierId },
          data: { currentDue: { decrement: dueDeduction } },
        });
      }

      // 5. Receive Refund into Cash Drawer / Bank Account (if vendor returned cash)
      if (sRefundAmount > 0) {
        const accountType = paymentMethod.toUpperCase();
        const paymentAccount = await tx.account.findFirst({
          where: {
            branchId: user.activeBranchId!,
            type: ["CASH", "BANK", "BKASH", "NAGAD"].includes(accountType)
              ? (accountType as any)
              : "CASH",
            status: "active",
          },
        });

        if (paymentAccount) {
          await tx.account.update({
            where: { id: paymentAccount.id },
            data: { currentBalance: { increment: sRefundAmount } },
          });
        }
      }
    });

    revalidatePath("/purchases");
    revalidatePath("/inventory");
    revalidatePath("/suppliers");
    revalidatePath("/dashboard");
    revalidatePath("/reports/closings");

    return { success: true, returnNo };
  } catch (error: any) {
    console.error("Purchase return error:", error);
    return { success: false, error: error.message || "পণ্য ফেরত সম্পন্ন করা সম্ভব হয়নি।" };
  }
}