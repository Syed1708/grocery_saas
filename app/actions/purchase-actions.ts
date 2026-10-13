"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.shopId) {
    throw new Error("Unauthorized: Please log in.");
  }
  if (session.user.role !== "OWNER" && session.user.role !== "MANAGER" && session.user.role !== "ADMIN") {
    throw new Error("Forbidden: Only Owners and Managers can record purchases.");
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
    throw new Error("No active branch found. Please select or configure a branch.");
  }

  return {
    ...session.user,
    activeBranchId,
  };
}

interface PurchaseItemInput {
  productId: string;
  quantity: number;
  unitCost: number;
  commission?: number;
}

interface CreatePurchasePayload {
  supplierId: string;
  chalanNo: string;
  paymentMethod?: string;
  paidAmount: number;
  discount?: number;
  transportCost?: number;
  vatPercent?: number;
  notes?: string;
  items: PurchaseItemInput[];
}

export async function createPurchaseAction(payload: CreatePurchasePayload) {
  try {
    const user = await getAuthenticatedUser();
    const {
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

    if (!supplierId || !chalanNo || !items || items.length === 0) {
      return { success: false, error: "Supplier, Chalan #, and at least one item are required." };
    }

    // Check duplicate chalan number within store
    const existing = await prisma.purchase.findUnique({
      where: { shopId_chalanNo: { shopId: user.shopId, chalanNo } },
    });
    if (existing) {
      return { success: false, error: `Purchase Chalan #${chalanNo} already exists in your store.` };
    }

    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, shopId: user.shopId },
    });
    if (!supplier) return { success: false, error: "Supplier not found." };

    // Calculate totals
    let subtotal = 0;
    let totalQuantity = 0;

    for (const item of items) {
      const comm = item.commission || 0;
      const line = item.quantity * item.unitCost - comm;
      subtotal += line;
      totalQuantity += item.quantity;
    }

    const baseAmount = Math.max(0, subtotal - discount);
    const vatAmount = (baseAmount * vatPercent) / 100;
    const grandTotal = baseAmount + transportCost + vatAmount;



    // ✅ CORRECT (Net Khata calculation)
const previousDue = Number(supplier.currentDue || 0);
const netPayable = grandTotal + previousDue; // 140 + 80 = 220
const dueAmount = Math.max(0, netPayable - paidAmount); // 220 - 200 = 20
const paymentStatus = dueAmount === 0 ? "PAID" : paidAmount > 0 ? "PARTIAL" : "DUE";

    // 👈 ATOMIC DATABASE TRANSACTION
    await prisma.$transaction(async (tx) => {
      // 1. Create Purchase Bill
      const purchase = await tx.purchase.create({
        data: {
          chalanNo,
          subtotal,
          totalQuantity,
          discount,
          transportCost,
          vatPercent,
          vatAmount,
          grandTotal,
          previousDue,
          paidAmount,
          dueAmount,
          paymentMethod,
          paymentStatus,
          notes: notes || null,
          supplierId,
          branchId: user.activeBranchId,
          shopId: user.shopId,
        },
      });

      // 2. Process Items: Create PurchaseItem, Increment ProductStock for branch, Update Cost
      for (const item of items) {
        const comm = item.commission || 0;
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

        // 👈 Increment stock in ProductStock for active branch
        await tx.productStock.upsert({
          where: {
            productId_branchId: {
              productId: item.productId,
              branchId: user.activeBranchId,
            },
          },
          update: {
            quantity: { increment: item.quantity },
          },
          create: {
            productId: item.productId,
            branchId: user.activeBranchId,
            quantity: item.quantity,
          },
        });

        // Update latest purchase price on product
        await tx.product.update({
          where: { id: item.productId },
          data: { purchasePrice: item.unitCost },
        });
      }

      // 3. Record Supplier Payment if paidAmount > 0
      if (paidAmount > 0) {
        await tx.supplierPayment.create({
          data: {
            amount: paidAmount,
            paymentMethod,
            voucherNo: `PAY-PUR-${Date.now().toString().slice(-6)}`,
            reference: chalanNo,
            note: `Payment for purchase chalan #${chalanNo}`,
            supplierId,
            purchaseId: purchase.id,
            branchId: user.activeBranchId,
          },
        });
      }

      // 4. Update Supplier Current Due
      if (dueAmount > 0) {
        await tx.supplier.update({
          where: { id: supplierId },
          data: { currentDue: { increment: dueAmount } },
        });
      } else if (paidAmount > grandTotal) {
        // If extra paid against previous debt
        const extraPaid = paidAmount - grandTotal;
        await tx.supplier.update({
          where: { id: supplierId },
          data: { currentDue: { decrement: Math.min(Number(supplier.currentDue), extraPaid) } },
        });
      }
    });

    revalidatePath("/dashboard/admin/purchases");
    revalidatePath("/dashboard/admin/products");
    revalidatePath("/dashboard/admin/suppliers");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Purchase creation error:", error);
    return { success: false, error: error.message || "Failed to record purchase." };
  }
}

// Add to app/actions/purchase-actions.ts

interface UpdatePurchasePayload {
  id: string;
  supplierId: string;
  chalanNo: string;
  paymentMethod?: string;
  paidAmount: number;
  discount?: number;
  transportCost?: number;
  vatPercent?: number;
  notes?: string;
  items: PurchaseItemInput[];
}

export async function updatePurchaseAction(payload: UpdatePurchasePayload) {
  try {
    const user = await getAuthenticatedUser();
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

    if (!id || !supplierId || !chalanNo || !items || items.length === 0) {
      return { success: false, error: "Supplier, Chalan #, and at least one item are required." };
    }

    const existingPurchase = await prisma.purchase.findFirst({
      where: { id, shopId: user.shopId },
      include: { items: true },
    });

    if (!existingPurchase) {
      return { success: false, error: "Purchase record not found." };
    }

    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, shopId: user.shopId },
    });
    if (!supplier) return { success: false, error: "Supplier not found." };

    // Calculate totals
    let subtotal = 0;
    let totalQuantity = 0;
    for (const item of items) {
      const comm = item.commission || 0;
      subtotal += item.quantity * item.unitCost - comm;
      totalQuantity += item.quantity;
    }

    const baseAmount = Math.max(0, subtotal - discount);
    const vatAmount = (baseAmount * vatPercent) / 100;
    const grandTotal = baseAmount + transportCost + vatAmount;

    const previousDue = Number(existingPurchase.previousDue);
    const netPayable = grandTotal + previousDue;
    const dueAmount = Math.max(0, netPayable - paidAmount);
    const paymentStatus = dueAmount === 0 ? "PAID" : paidAmount > 0 ? "PARTIAL" : "DUE";

    await prisma.$transaction(async (tx) => {
      // 1. Rollback old stock quantities
      for (const oldItem of existingPurchase.items) {
        await tx.productStock.updateMany({
          where: { productId: oldItem.productId, branchId: user.activeBranchId },
          data: { quantity: { decrement: oldItem.quantity } },
        });
      }

      // 2. Delete old items
      await tx.purchaseItem.deleteMany({ where: { purchaseId: id } });

      // 3. Create updated items and apply new stock
      for (const item of items) {
        const comm = item.commission || 0;
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
            productId_branchId: { productId: item.productId, branchId: user.activeBranchId },
          },
          update: { quantity: { increment: item.quantity } },
          create: {
            productId: item.productId,
            branchId: user.activeBranchId,
            quantity: item.quantity,
          },
        });

        await tx.product.update({
          where: { id: item.productId },
          data: { purchasePrice: item.unitCost },
        });
      }

      // 4. Update Supplier ledger due difference
      const oldDueDiff = Number(existingPurchase.dueAmount);
      const netDueDelta = dueAmount - oldDueDiff;
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
          chalanNo,
          subtotal,
          totalQuantity,
          discount,
          transportCost,
          vatPercent,
          vatAmount,
          grandTotal,
          paidAmount,
          dueAmount,
          paymentMethod,
          paymentStatus,
          notes: notes || null,
        },
      });
    });

    revalidatePath("/dashboard/admin/purchases");
    revalidatePath("/dashboard/admin/products");
    revalidatePath("/dashboard/admin/suppliers");
    return { success: true };
  } catch (error: any) {
    console.error("Update purchase error:", error);
    return { success: false, error: error.message || "Failed to update purchase." };
  }
}

// app/actions/purchase-actions.ts

export async function deletePurchaseAction(purchaseId: string) {
  try {
    const user = await getAuthenticatedUser();

    // 1. Fetch purchase with items and supplier
    const purchase = await prisma.purchase.findFirst({
      where: { id: purchaseId, shopId: user.shopId },
      include: { items: true, supplier: true },
    });

    if (!purchase) {
      return { success: false, error: "Purchase invoice not found." };
    }

    // 2. Perform Atomic Rollback in a single transaction
    await prisma.$transaction(async (tx) => {
      // A. Revert Branch Stock for every line item
      for (const item of purchase.items) {
        await tx.productStock.updateMany({
          where: {
            productId: item.productId,
            branchId: purchase.branchId || user.activeBranchId,
          },
          data: {
            quantity: { decrement: item.quantity },
          },
        });
      }

      // B. Revert Supplier Due (Bakir Khata)
      // If this invoice left an unpaid due, subtract it from supplier's balance
      if (Number(purchase.dueAmount) > 0) {
        await tx.supplier.update({
          where: { id: purchase.supplierId },
          data: {
            currentDue: { decrement: Number(purchase.dueAmount) },
          },
        });
      }

      // C. Remove any SupplierPayment vouchers tied to this purchase
      await tx.supplierPayment.deleteMany({
        where: { purchaseId: purchase.id },
      });

      // D. Delete line items and the purchase invoice
      await tx.purchaseItem.deleteMany({
        where: { purchaseId: purchase.id },
      });

      await tx.purchase.delete({
        where: { id: purchase.id },
      });
    });

    // 3. Revalidate dashboard caches
    revalidatePath("/dashboard/admin/purchases");
    revalidatePath("/dashboard/admin/suppliers");
    revalidatePath("/dashboard/admin/products");
    return { success: true };
  } catch (error: any) {
    console.error("Delete purchase error:", error);
    return { success: false, error: error.message || "Failed to delete purchase invoice." };
  }
}