"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";



export async function createSaleReturnAction(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.shopId || !session?.user?.branchId) {
      return { success: false, error: "Unauthorized access: Active branch session required." };
    }

    const { shopId, branchId, id: userId } = session.user;

    const saleId = formData.get("saleId")?.toString();
    const refundMethod = formData.get("refundMethod")?.toString() || "cash";
    const notes = formData.get("notes")?.toString().trim() || null;

    if (!saleId) return { success: false, error: "Sale invoice ID is required." };

    // 1. Fetch Sale with prior returns to prevent double-returns
    const sale = await prisma.sale.findFirst({
      where: { id: saleId, shopId, branchId },
      include: {
        items: true,
        customer: true,
        returns: {
          include: { items: true },
        },
      },
    });

    if (!sale) return { success: false, error: "Sale invoice not found in this branch." };

    // Map already returned quantities per sale item
    const alreadyReturnedMap = new Map<string, number>();
    for (const priorReturn of sale.returns) {
      for (const rItem of priorReturn.items) {
        const cur = alreadyReturnedMap.get(rItem.productId) || 0;
        alreadyReturnedMap.set(rItem.productId, cur + Number(rItem.quantity));
      }
    }

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
        const alreadyReturned = alreadyReturnedMap.get(item.productId) || 0;
        const availableQtyToReturn = Number(item.quantity) - alreadyReturned;

        if (qty > availableQtyToReturn) {
          return {
            success: false,
            error: `Cannot return ${qty} units. Only ${availableQtyToReturn} units remain eligible for return.`,
          };
        }

        // Use actual selling price per item
        const unitPrice = Number(item.unitPrice);
        const lineRefund = qty * unitPrice;
        totalRefund += lineRefund;

        returnItemsData.push({
          productId: item.productId,
          unitId: item.unitId,
          quantity: qty,
          refundPrice: unitPrice,
          condition: conditionStr,
        });
      }
    }

    if (returnItemsData.length === 0 || totalRefund <= 0) {
      return { success: false, error: "Please specify valid return quantities." };
    }

    // 2. CRITICAL BUSINESS GUARD: Prevent Cash Leakage on Unpaid Sales
    const salePaid = Number(sale.paidAmount);
    if (refundMethod === "cash" && salePaid < totalRefund) {
      return {
        success: false,
        error: `Cannot refund ৳${totalRefund.toFixed(2)} in cash. Customer only paid ৳${salePaid.toFixed(2)} on this invoice. Use 'balance' (Adjust from Khata) instead.`,
      };
    }

    const returnNo = `RET-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    // 3. ATOMIC TRANSACTION
    await prisma.$transaction(async (tx) => {
      // A. Create the Sale Return Record
      const saleReturn = await tx.saleReturn.create({
        data: {
          returnNo,
          totalRefund,
          refundMethod,
          notes,
          branchId,
          saleId: sale.id,
          customerId: sale.customerId,
          userId: userId ?? null,
          shopId,
        },
      });

      // B. Process Items & Restock inventory
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

        if (rItem.condition === "RESTOCK") {
          await tx.productStock.upsert({
            where: {
              productId_branchId: {
                productId: rItem.productId,
                branchId,
              },
            },
            update: { quantity: { increment: rItem.quantity } },
            create: { productId: rItem.productId, branchId, quantity: rItem.quantity },
          });
        }
      }

      // C. Update the Original Sale Invoice Values
      if (refundMethod === "balance") {
        // Reduce the due amount on this specific invoice
        const currentSaleDue = Number(sale.dueAmount);
        const dueDeduction = Math.min(currentSaleDue, totalRefund);

        await tx.sale.update({
          where: { id: sale.id },
          data: {
            dueAmount: { decrement: dueDeduction },
            grandTotal: { decrement: totalRefund },
            paymentStatus: currentSaleDue - dueDeduction <= 0 ? "paid" : "partial",
          },
        });

        // D. Deduct from Customer's overall Bakir Khata
        if (sale.customerId) {
          await tx.customer.update({
            where: { id: sale.customerId },
            data: {
              currentDue: { decrement: dueDeduction },
            },
          });
        }
      } else {
        // Cash Refund: Invoice grand total reflects return, paid amount drops by cash returned
        await tx.sale.update({
          where: { id: sale.id },
          data: {
            grandTotal: { decrement: totalRefund },
            paidAmount: { decrement: totalRefund },
          },
        });
      }
    });

    revalidatePath("/reports/sales");
    revalidatePath("/reports/customers-due");
    revalidatePath("/dashboard/admin/returns");
    return { success: true };
  } catch (error: any) {
    console.error("Sale return error:", error);
    return { success: false, error: error.message || "Failed to process sale return." };
  }
}

// Add this function to app/actions/return-actions.ts:
export async function searchSaleForReturnAction(invoiceNo: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.shopId) {
      return { success: false, error: "Unauthorized access." };
    }

    const { shopId, branchId } = session.user;

    const sale = await prisma.sale.findFirst({
      where: {
        invoiceNo: invoiceNo.trim(),
        shopId,
        branchId,
      },
      include: {
        customer: { select: { name: true, phone: true } },
        items: {
          include: {
            product: { select: { name: true, barcode: true } },
            unit: { select: { shortCode: true } },
          },
        },
        returns: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!sale) {
      return { success: false, error: `Invoice #${invoiceNo} not found in this branch.` };
    }

    // 1. Calculate cumulative returned quantity per product on this invoice
    const returnedQtyMap = new Map<string, number>();
    for (const ret of sale.returns) {
      for (const rItem of ret.items) {
        const cur = returnedQtyMap.get(rItem.productId) || 0;
        returnedQtyMap.set(rItem.productId, cur + Number(rItem.quantity));
      }
    }

    // 2. Compute remaining returnable quantity for each item
    const eligibleItems = [];
    for (const item of sale.items) {
      const totalSold = Number(item.quantity);
      const alreadyReturned = returnedQtyMap.get(item.productId) || 0;
      const remainingQty = Math.max(0, totalSold - alreadyReturned);

      // Only include items that have remaining returnable stock!
      if (remainingQty > 0) {
        eligibleItems.push({
          id: item.id,
          productId: item.productId,
          productName: item.product.name,
          barcode: item.product.barcode,
          unitCode: item.unit?.shortCode || "pcs",
          unitPrice: Number(item.unitPrice),
          totalSoldQty: totalSold,
          alreadyReturnedQty: alreadyReturned,
          remainingQty: remainingQty,
        });
      }
    }

    // 3. If every single item has already been returned
    if (eligibleItems.length === 0) {
      return {
        success: false,
        error: `এই ইনভয়েসের (${sale.invoiceNo}) সকল পণ্য ইতোমধ্যে ফেরত নেওয়া হয়েছে। (All items already returned).`,
      };
    }

    return {
      success: true,
      sale: {
        id: sale.id,
        invoiceNo: sale.invoiceNo,
        customerName: sale.customer?.name || "Walk-in Customer",
        grandTotal: Number(sale.grandTotal),
        paidAmount: Number(sale.paidAmount),
        dueAmount: Number(sale.dueAmount),
        items: eligibleItems, // Only returnable items sent to the modal!
      },
    };
  } catch (error: any) {
    console.error("searchSaleForReturnAction error:", error);
    return { success: false, error: "Failed to search invoice for return." };
  }
}