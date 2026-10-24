"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.shopId) throw new Error("Unauthorized");

  let activeBranchId = session.user.branchId;
  if (!activeBranchId) {
    const mainBranch = await prisma.branch.findFirst({
      where: { shopId: session.user.shopId, isMain: true },
      select: { id: true },
    });
    activeBranchId = mainBranch?.id || null;
  }

  return {
    userId: session.user.id,
    shopId: session.user.shopId,
    activeBranchId: activeBranchId || "",
  };
}

export async function createSaleReturnAction(formData: FormData) {
  try {
    const user = await getAuthenticatedUser();

    const saleId = formData.get("saleId")?.toString();
    const refundMethod = formData.get("refundMethod")?.toString() || "cash";
    const notes = formData.get("notes")?.toString().trim() || null;

    if (!saleId) return { success: false, error: "Sale invoice ID is required." };

    const sale = await prisma.sale.findFirst({
      where: { id: saleId, shopId: user.shopId },
      include: { items: true, customer: true },
    });

    if (!sale) return { success: false, error: "Sale invoice not found." };

    const returnItemsData: {
      productId: string;
      unitId: string | null;
      quantity: number;
      refundPrice: number;
      condition: "RESTOCK" | "DAMAGED";
    }[] = [];

    let totalRefund = 0;

    for (const item of sale.items) {
      const qtyStr = formData.get(`return_qty_${item.id}`)?.toString();
      const conditionStr = (formData.get(`condition_${item.id}`)?.toString() as "RESTOCK" | "DAMAGED") || "RESTOCK";
      const qty = parseFloat(qtyStr || "0");

      if (qty > 0) {
        if (qty > Number(item.quantity)) {
          return { success: false, error: "Return quantity cannot exceed sold quantity." };
        }
        const lineRefund = qty * Number(item.unitPrice);
        totalRefund += lineRefund;

        returnItemsData.push({
          productId: item.productId,
          unitId: item.unitId,
          quantity: qty,
          refundPrice: Number(item.unitPrice),
          condition: conditionStr,
        });
      }
    }

    if (returnItemsData.length === 0 || totalRefund <= 0) {
      return { success: false, error: "Please specify quantities to return for at least one item." };
    }

    const returnNo = `RET-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    // 👈 ATOMIC DATABASE TRANSACTION
    await prisma.$transaction(async (tx) => {
      // 1. Create Sale Return Header
      const saleReturn = await tx.saleReturn.create({
        data: {
          returnNo,
          totalRefund,
          refundMethod,
          notes,
          branchId: user.activeBranchId,
          saleId: sale.id,
          customerId: sale.customerId,
          userId: user.userId,
          shopId: user.shopId,
        },
      });

      // 2. Process Return Items & Restock if condition is RESTOCK
      for (const rItem of returnItemsData) {
        await tx.saleReturnItem.create({
          data: {
            saleReturnId: saleReturn.id,
            productId: rItem.productId,
            unitId: rItem.unitId,
            quantity: rItem.quantity,
            refundPrice: rItem.refundPrice,
            itemCondition: rItem.condition,
          },
        });

        if (rItem.condition === "RESTOCK" && user.activeBranchId) {
          await tx.productStock.upsert({
            where: {
              productId_branchId: {
                productId: rItem.productId,
                branchId: user.activeBranchId,
              },
            },
            update: { quantity: { increment: rItem.quantity } },
            create: { productId: rItem.productId, branchId: user.activeBranchId, quantity: rItem.quantity },
          });
        }
      }

      // 3. If refundMethod is balance, deduct from customer currentDue
      if (sale.customerId && refundMethod === "balance") {
        await tx.customer.update({
          where: { id: sale.customerId },
          data: { currentDue: { decrement: Math.min(Number(sale.customer?.currentDue || 0), totalRefund) } },
        });
      }
    });

    revalidatePath("/dashboard/admin/returns");
    revalidatePath("/dashboard/admin/sales");
    revalidatePath("/dashboard/admin/products");
    return { success: true };
  } catch (error: any) {
    console.error("Sale return error:", error);
    return { success: false, error: error.message || "Failed to process return." };
  }
}

// Add this function to app/actions/return-actions.ts:
export async function searchSaleForReturnAction(invoiceNo: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.shopId) throw new Error("Unauthorized");

    const cleanNo = invoiceNo.replace("#", "").trim();
    const sale = await prisma.sale.findFirst({
      where: { shopId: session.user.shopId, invoiceNo: cleanNo },
      include: {
        customer: { select: { id: true, name: true, phone: true, currentDue: true } },
        items: {
          include: {
            product: { select: { name: true } },
            unit: { select: { shortCode: true } },
          },
        },
      },
    });

    if (!sale) return { success: false, error: "Invoice not found." };

    return {
      success: true,
      sale: {
        id: sale.id,
        invoiceNo: sale.invoiceNo,
        saleDate: sale.saleDate,
        grandTotal: Number(sale.grandTotal),
        customerName: sale.customer?.name || "Walk-in Customer",
        customerDue: Number(sale.customer?.currentDue || 0),
        items: sale.items.map((it) => ({
          id: it.id,
          productId: it.productId,
          productName: it.product.name,
          unitCode: it.unit?.shortCode || "pcs",
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          lineTotal: Number(it.lineTotal),
        })),
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Search failed." };
  }
}