"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/guard";
import { CreatePurchasePayload, PERMISSIONS, UpdatePurchasePayload } from "@/types";

// ==========================================
// 1. CREATE PURCHASE CHALAN
// ==========================================
export async function createPurchaseAction(payload: CreatePurchasePayload) {
  try {
    // 🛡️ Zero-Trust Guard: Resolve active branch and verify permissions
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });

    if (!user.activeBranchId) {
      return { success: false, error: "সক্রিয় ব্রাঞ্চ পাওয়া যায়নি।" };
    }

    const {
      supplierId,
      chalanNo,
      purchaseDate,
      paymentMethod = "cash",
      paidAmount = 0,
      discount = 0,
      transportCost = 0,
      vatPercent = 0,
      notes,
      items,
    } = payload;

    const cleanChalanNo = chalanNo.trim();

    if (!supplierId || !cleanChalanNo || !items || items.length === 0) {
      return { success: false, error: "সাপ্লায়ার, চালান নম্বর এবং কমপক্ষে একটি পণ্য আবশ্যক।" };
    }

    // Check duplicate chalan number within store
    const existing = await prisma.purchase.findUnique({
      where: { shopId_chalanNo: { shopId: user.shopId, chalanNo: cleanChalanNo } },
    });
    if (existing) {
      return { success: false, error: `চালান #${cleanChalanNo} ইতোমধ্যেই এই দোকানে বিদ্যমান।` };
    }

    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, shopId: user.shopId },
    });
    if (!supplier) return { success: false, error: "সাপ্লায়ার খুঁজে পাওয়া যায়নি।" };

    // Calculate Chalan Totals
    let subtotal = 0;
    let totalQuantity = 0;

    for (const item of items) {
      const qty = Number(item.quantity);
      const cost = Number(item.unitCost);
      const comm = Number(item.commission || 0);

      if (qty <= 0 || cost <= 0) {
        return { success: false, error: "পণ্যের পরিমাণ এবং ক্রয়মূল্য শূন্যের বেশি হতে হবে।" };
      }

      subtotal += qty * cost - comm;
      totalQuantity += qty;
    }

    const sDiscount = Math.max(0, Number(discount) || 0);
    const sTransport = Math.max(0, Number(transportCost) || 0);
    const sVatPercent = Math.max(0, Number(vatPercent) || 0);
    const sPaidAmount = Math.max(0, Number(paidAmount) || 0);

    const baseAmount = Math.max(0, subtotal - sDiscount);
    const vatAmount = Math.round(((baseAmount * sVatPercent) / 100) * 100) / 100;
    const grandTotal = Math.round((baseAmount + sTransport + vatAmount) * 100) / 100;

    // 🛡️ ACCURATE KHATA MATH (Fixed previous due explosion!)
    const previousDue = Number(supplier.currentDue || 0);
    // Chalan-specific due (how much of this invoice remains unpaid)
    const chalanDue = Math.max(0, grandTotal - sPaidAmount);
    // Status reflects this chalan
    const paymentStatus = chalanDue === 0 ? "PAID" : sPaidAmount > 0 ? "PARTIAL" : "DUE";
    // Net delta that will be added/subtracted from supplier's overall balance
    const netKhataDelta = grandTotal - sPaidAmount;

    // 🚀 ATOMIC DATABASE TRANSACTION
    await prisma.$transaction(async (tx) => {
      // 1. Create Purchase Bill
      const purchase = await tx.purchase.create({
        data: {
          chalanNo: cleanChalanNo,
          subtotal,
          totalQuantity,
          discount: sDiscount,
          transportCost: sTransport,
          vatPercent: sVatPercent,
          vatAmount,
          grandTotal,
          previousDue,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
          paidAmount: sPaidAmount,
          dueAmount: chalanDue,
          paymentMethod,
          paymentStatus,
          notes: notes || null,
          supplierId,
          branchId: user.activeBranchId,
          shopId: user.shopId,
        },
      });

      // 2. Process Items: Increment ProductStock & Update Latest Cost
      for (const item of items) {
        const comm = Number(item.commission || 0);
        const lineTotal = item.quantity * item.unitCost - comm;

        await tx.purchaseItem.create({
          data: {
            purchaseId: purchase.id,
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            commission: comm,
            lineTotal,
          },
        });

        // Increment stock in ProductStock for active branch
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

        // Update product's latest purchase cost
        await tx.product.update({
          where: { id: item.productId },
          data: { purchasePrice: item.unitCost },
        });
      }

      // 3. Record Supplier Payment Voucher
      if (sPaidAmount > 0) {
        await tx.supplierPayment.create({
          data: {
            amount: sPaidAmount,
            paymentMethod,
            voucherNo: `PAY-PUR-${Date.now().toString().slice(-6)}`,
            reference: cleanChalanNo,
            note: `Payment for purchase chalan #${cleanChalanNo}`,
            supplierId,
            purchaseId: purchase.id,
            branchId: user.activeBranchId,
          },
        });

        // 👈 DEDUCT CASH DRAWER / BANK ACCOUNT (Real Financial Sync)
        const accountType = paymentMethod.toUpperCase();
        const paymentAccount = await tx.account.findFirst({
          where: {
            branchId: user.activeBranchId,
            type: ["CASH", "BANK", "BKASH", "NAGAD"].includes(accountType) ? (accountType as any) : "CASH",
            status: "active",
          },
        });

        if (paymentAccount) {
          await tx.account.update({
            where: { id: paymentAccount.id },
            data: { currentBalance: { decrement: sPaidAmount } },
          });
        }
      }

      // 4. Update Supplier Current Due (Accurate Net Khata Delta)
      await tx.supplier.update({
        where: { id: supplierId },
        data: { currentDue: { increment: netKhataDelta } },
      });
    });

    revalidatePath("/purchases");
    revalidatePath("/inventory");
    revalidatePath("/suppliers");
    revalidatePath("/dashboard");
    revalidatePath("/reports/closings");

    return { success: true };
  } catch (error: any) {
    console.error("Purchase creation error:", error);
    return { success: false, error: error.message || "চালান এন্ট্রি সম্পন্ন করা সম্ভব হয়নি।" };
  }
}

// ==========================================
// 2. UPDATE PURCHASE CHALAN
// ==========================================
export async function updatePurchaseAction(payload: UpdatePurchasePayload) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.FINANCE_LOANS,
      requireActiveStatus: true,
    });

    const {
      id,
      supplierId,
      chalanNo,
      paymentMethod = "cash",
      paidAmount = 0,
      discount = 0,
      transportCost = 0,
      vatPercent = 0,
      notes,
      items,
    } = payload;

    const existingPurchase = await prisma.purchase.findFirst({
      where: { id, shopId: user.shopId },
      include: { items: true },
    });

    if (!existingPurchase) {
      return { success: false, error: "চালান খুঁজে পাওয়া যায়নি।" };
    }

    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, shopId: user.shopId },
    });
    if (!supplier) return { success: false, error: "সাপ্লায়ার পাওয়া যায়নি।" };

    // Calculate new totals
    let subtotal = 0;
    let totalQuantity = 0;
    for (const item of items) {
      const comm = Number(item.commission || 0);
      subtotal += item.quantity * item.unitCost - comm;
      totalQuantity += item.quantity;
    }

    const sDiscount = Math.max(0, Number(discount) || 0);
    const sTransport = Math.max(0, Number(transportCost) || 0);
    const sVatPercent = Math.max(0, Number(vatPercent) || 0);
    const sPaidAmount = Math.max(0, Number(paidAmount) || 0);

    const baseAmount = Math.max(0, subtotal - sDiscount);
    const vatAmount = Math.round(((baseAmount * sVatPercent) / 100) * 100) / 100;
    const grandTotal = Math.round((baseAmount + sTransport + vatAmount) * 100) / 100;

    const chalanDue = Math.max(0, grandTotal - sPaidAmount);
    const paymentStatus = chalanDue === 0 ? "PAID" : sPaidAmount > 0 ? "PARTIAL" : "DUE";

    // 🛡️ Calculate exact difference between old and new purchase impact on supplier debt
    const oldNetImpact = Number(existingPurchase.grandTotal) - Number(existingPurchase.paidAmount);
    const newNetImpact = grandTotal - sPaidAmount;
    const netDueDelta = newNetImpact - oldNetImpact;

    // Use original purchase branch to prevent cross-branch corruption
    const purchaseBranchId = existingPurchase.branchId || user.activeBranchId;

    await prisma.$transaction(async (tx) => {
      // 1. Rollback old stock using the original purchase branch
      for (const oldItem of existingPurchase.items) {
        await tx.productStock.updateMany({
          where: { productId: oldItem.productId, branchId: purchaseBranchId },
          data: { quantity: { decrement: oldItem.quantity } },
        });
      }

      // 2. Delete old items
      await tx.purchaseItem.deleteMany({ where: { purchaseId: id } });

      // 3. Create updated items and apply new stock
      for (const item of items) {
        const comm = Number(item.commission || 0);
        const lineTotal = item.quantity * item.unitCost - comm;

        await tx.purchaseItem.create({
          data: {
            purchaseId: id,
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            commission: comm,
            lineTotal,
          },
        });

        await tx.productStock.upsert({
          where: {
            productId_branchId: { productId: item.productId, branchId: purchaseBranchId },
          },
          update: { quantity: { increment: item.quantity } },
          create: {
            productId: item.productId,
            branchId: purchaseBranchId,
            quantity: item.quantity,
          },
        });

        await tx.product.update({
          where: { id: item.productId },
          data: { purchasePrice: item.unitCost },
        });
      }

      // 4. Update Supplier currentDue with the exact net delta
      if (netDueDelta !== 0) {
        await tx.supplier.update({
          where: { id: supplierId },
          data: { currentDue: { increment: netDueDelta } },
        });
      }

      // 5. Update purchase bill record
      await tx.purchase.update({
        where: { id },
        data: {
          supplierId,
          chalanNo: chalanNo.trim(),
          subtotal,
          totalQuantity,
          discount: sDiscount,
          transportCost: sTransport,
          vatPercent: sVatPercent,
          vatAmount,
          grandTotal,
          paidAmount: sPaidAmount,
          dueAmount: chalanDue,
          paymentMethod,
          paymentStatus,
          notes: notes || null,
        },
      });
    });

    revalidatePath("/purchases");
    revalidatePath("/inventory");
    revalidatePath("/suppliers");
    return { success: true };
  } catch (error: any) {
    console.error("Update purchase error:", error);
    return { success: false, error: error.message || "চালান আপডেট ব্যর্থ হয়েছে।" };
  }
}

// ==========================================
// 3. DELETE PURCHASE CHALAN (ATOMIC ROLLBACK)
// ==========================================
export async function deletePurchaseAction(purchaseId: string) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.FINANCE_LOANS,
      requireActiveStatus: true,
    });

    // Only OWNER can delete purchase chalans
    if (user.role !== "OWNER") {
      return { success: false, error: "অনুমতি নেই: শুধুমাত্র দোকানের মালিক চালান মুছে ফেলতে পারেন।" };
    }

    const purchase = await prisma.purchase.findFirst({
      where: { id: purchaseId, shopId: user.shopId },
      include: { items: true, supplier: true },
    });

    if (!purchase) {
      return { success: false, error: "চালান খুঁজে পাওয়া যায়নি।" };
    }

    const purchaseBranchId = purchase.branchId || user.activeBranchId;
    // Net debt left by this chalan that must be removed from supplier balance
    const netDebtToRevert = Number(purchase.grandTotal) - Number(purchase.paidAmount);
    const paidToRevert = Number(purchase.paidAmount);

    await prisma.$transaction(async (tx) => {
      // 1. Revert Branch Stock for every line item
      for (const item of purchase.items) {
        await tx.productStock.updateMany({
          where: {
            productId: item.productId,
            branchId: purchaseBranchId,
          },
          data: {
            quantity: { decrement: item.quantity },
          },
        });
      }

      // 2. Revert Supplier Due (Bakir Khata)
      if (netDebtToRevert !== 0) {
        await tx.supplier.update({
          where: { id: purchase.supplierId },
          data: { currentDue: { decrement: netDebtToRevert } },
        });
      }

      // 3. Refund physical cash back to drawer if money was paid
      if (paidToRevert > 0 && purchase.paymentMethod === "cash") {
        const cashDrawer = await tx.account.findFirst({
          where: { branchId: purchaseBranchId, type: "CASH", status: "active" },
        });
        if (cashDrawer) {
          await tx.account.update({
            where: { id: cashDrawer.id },
            data: { currentBalance: { increment: paidToRevert } },
          });
        }
      }

      // 4. Remove payment vouchers tied to this purchase
      await tx.supplierPayment.deleteMany({
        where: { purchaseId: purchase.id },
      });

      // 5. Delete line items and the purchase invoice
      await tx.purchaseItem.deleteMany({
        where: { purchaseId: purchase.id },
      });

      await tx.purchase.delete({
        where: { id: purchase.id },
      });
    });

    revalidatePath("/purchases");
    revalidatePath("/suppliers");
    revalidatePath("/inventory");
    revalidatePath("/dashboard/closings");
    return { success: true };
  } catch (error: any) {
    console.error("Delete purchase error:", error);
    return { success: false, error: error.message || "চালান মুছে ফেলা সম্ভব হয়নি।" };
  }
}