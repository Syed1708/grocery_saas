"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getAuthenticatedCashier() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.shopId) {
    throw new Error("Unauthorized: Please log in.");
  }

  let activeBranchId = session.user.branchId;
  if (!activeBranchId) {
    const mainBranch = await prisma.branch.findFirst({
      where: { shopId: session.user.shopId, isMain: true },
      select: { id: true },
    });
    activeBranchId = mainBranch?.id || null;
  }

  if (!activeBranchId) {
    throw new Error("No active branch configured for this cashier.");
  }

  return {
    ...session.user,
    activeBranchId,
  };
}

interface CheckoutItemPayload {
  productId: string;
  quantity: number;
  unitPrice: number;
  unitId?: string;
}

interface CheckoutPayload {
  customerId?: string | null;
  items: CheckoutItemPayload[];
  discount?: number;
  vatPercent?: number;
  cashPaid?: number;
  bkashPaid?: number;
  bankPaid?: number;
  notes?: string;
  offlineUuid?: string;
}

export async function checkoutAction(payload: CheckoutPayload) {
  try {
    const user = await getAuthenticatedCashier();
    const {
      customerId,
      items,
      discount = 0,
      vatPercent = 0,
      cashPaid = 0,
      bkashPaid = 0,
      bankPaid = 0,
      notes,
      offlineUuid,
    } = payload;

    if (!items || items.length === 0) {
      return { success: false, error: "Cart is empty. Add products to checkout." };
    }

    // 1. Calculate Totals
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const baseAmount = Math.max(0, subtotal - discount);
    const vatAmount = (baseAmount * vatPercent) / 100;
    const grandTotal = baseAmount + vatAmount;

    const totalPaid = cashPaid + bkashPaid + bankPaid;
    const currentInvoiceDue = Math.max(0, grandTotal - totalPaid);
    const changeAmount = Math.max(0, totalPaid - grandTotal);

    let paymentStatus: "paid" | "partial" | "due" = "paid";
    if (currentInvoiceDue > 0) {
      paymentStatus = totalPaid > 0 ? "partial" : "due";
    }

    // Determine payment method tag
    const paidMethods = [
      cashPaid > 0 && "cash",
      bkashPaid > 0 && "bkash",
      bankPaid > 0 && "bank",
    ].filter(Boolean);

    let paymentMethod = "cash";
    if (paidMethods.length > 1) {
      paymentMethod = "mixed";
    } else if (paidMethods.length === 1) {
      paymentMethod = paidMethods[0] as string;
    } else if (currentInvoiceDue > 0) {
      paymentMethod = "due";
    }

    // Credit limit verification for dues
    if (currentInvoiceDue > 0) {
      if (!customerId) {
        return { success: false, error: "Cannot sell on credit/due to anonymous Walk-in customer. Select a permanent customer." };
      }
      const customer = await prisma.customer.findUnique({ where: { id: customerId } });
      if (customer && Number(customer.currentDue) + currentInvoiceDue > Number(customer.creditLimit)) {
        return { success: false, error: `Customer credit limit exceeded! Max allowed limit: ৳${customer.creditLimit}` };
      }
    }

    const invoiceNo = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    // 👈 2. ATOMIC DATABASE TRANSACTION (Sale + Stock Deduct + Customer Due)
    const sale = await prisma.$transaction(async (tx) => {
      // Create Sale Header
      const createdSale = await tx.sale.create({
        data: {
          invoiceNo,
          subtotal,
          discount,
          vatPercent,
          vatAmount,
          grandTotal,
          paidAmount: Math.min(totalPaid, grandTotal),
          dueAmount: currentInvoiceDue,
          changeAmount,
          paymentMethod,
          paymentStatus,
          offlineUuid: offlineUuid || null,
          notes: notes || `Split: Cash ৳${cashPaid}, bKash ৳${bkashPaid}, Bank ৳${bankPaid}`,
          branchId: user.activeBranchId,
          customerId: customerId || null,
          userId: user.id,
          shopId: user.shopId,
        },
      });

      // Process Line Items & Deduct Branch Stock
      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) continue;

        const lineTotal = item.quantity * item.unitPrice;

        await tx.saleItem.create({
          data: {
            saleId: createdSale.id,
            productId: item.productId,
            unitId: item.unitId || product.unitId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            purchaseCost: product.purchasePrice,
            lineTotal,
          },
        });

        // 👈 Deduct stock from ProductStock in active branch
        await tx.productStock.upsert({
          where: {
            productId_branchId: {
              productId: item.productId,
              branchId: user.activeBranchId,
            },
          },
          update: {
            quantity: { decrement: item.quantity },
          },
          create: {
            productId: item.productId,
            branchId: user.activeBranchId,
            quantity: -item.quantity,
          },
        });
      }

      // Update Customer Khata Due
      if (customerId) {
        if (currentInvoiceDue > 0) {
          await tx.customer.update({
            where: { id: customerId },
            data: { currentDue: { increment: currentInvoiceDue } },
          });
        } else if (totalPaid > grandTotal) {
          // Extra money pays down previous debt
          const extraPaid = totalPaid - grandTotal;
          await tx.customer.update({
            where: { id: customerId },
            data: { currentDue: { decrement: extraPaid } },
          });
        }
      }

      return createdSale;
    });

    revalidatePath("/dashboard/admin/products");
    revalidatePath("/dashboard/admin/customers");
    revalidatePath("/dashboard/admin/sales");
    revalidatePath("/dashboard");

    return {
      success: true,
      saleId: sale.id,
      invoiceNo: sale.invoiceNo,
      grandTotal,
      changeAmount,
    };
  } catch (error: any) {
    console.error("POS Checkout error:", error);
    return { success: false, error: error.message || "Checkout failed." };
  }
}