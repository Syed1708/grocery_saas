"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import { IReturnableSale, IReturnableSaleItem, ICompletedReturn } from "@/types/sale";

/**
 * 1. SEARCH INVOICE FOR RETURN ACTION
 * - Strict Zero-Trust authentication & active branch scoping
 * - Prevents double-return fraud by calculating remaining returnable quantity per item
 * - Pulls customer type and live due balance for validation
 */
export async function searchSaleForReturnAction(invoiceNo: string) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.POS_ACCESS,
      requireActiveStatus: true,
    });

    if (!user.activeBranchId) {
      return { success: false, error: "সক্রিয় ব্রাঞ্চ পাওয়া যায়নি।" };
    }

    const cleanInvoiceNo = invoiceNo.replace("#", "").trim();

    const sale = await prisma.sale.findFirst({
      where: {
        invoiceNo: cleanInvoiceNo,
        shopId: user.shopId,
        branchId: user.activeBranchId, // 🛡️ Scoped strictly to active branch
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            currentDue: true,
            type: true,
          },
        },
        items: {
          include: {
            product: { select: { id: true, name: true, barcode: true } },
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
      return { success: false, error: `চালান #${cleanInvoiceNo} এই শাখায় পাওয়া যায়নি।` };
    }

    // Cumulative returned quantities per product on this invoice
    const returnedQtyMap = new Map<string, number>();
    for (const ret of sale.returns) {
      for (const rItem of ret.items) {
        const cur = returnedQtyMap.get(rItem.productId) || 0;
        returnedQtyMap.set(rItem.productId, cur + Number(rItem.quantity));
      }
    }

    // Compute remaining eligible return items
    const eligibleItems: IReturnableSaleItem[] = [];
    for (const item of sale.items) {
      const totalSold = Number(item.quantity);
      const alreadyReturned = returnedQtyMap.get(item.productId) || 0;
      const remainingQty = Math.max(0, totalSold - alreadyReturned);

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

    if (eligibleItems.length === 0) {
      return {
        success: false,
        error: `এই চালানের (${sale.invoiceNo}) সকল পণ্য ইতোমধ্যে ফেরত নেওয়া হয়েছে।`,
      };
    }

    const returnableSale: IReturnableSale = {
      id: sale.id,
      invoiceNo: sale.invoiceNo,
      customerId: sale.customerId || null,
      customerName: sale.customer ? sale.customer.name : "খুচরা ক্রেতা (Walk-in)",
      customerType: sale.customer?.type || "WALK_IN",
      customerDue: Number(sale.customer?.currentDue || 0),
      grandTotal: Number(sale.grandTotal),
      paidAmount: Number(sale.paidAmount),
      dueAmount: Number(sale.dueAmount),
      items: eligibleItems,
    };

    return {
      success: true,
      sale: returnableSale,
    };
  } catch (error: any) {
    console.error("searchSaleForReturnAction error:", error);
    return { success: false, error: "চালান অনুসন্ধান করতে ব্যর্থ হয়েছে।" };
  }
}

/**
 * PROCESS SALE RETURN ACTION
 * - Anti-Fraud: Prevents returning more units than originally bought
 * - RESTOCK condition: Restocks inventory into active branch
 * - DAMAGED condition: Does NOT restock; logs an automated wholesale wastage loss in expenses
 * - Walk-in guard: Prevents balance refunds on walk-ins
 * - 0-Due guard: Enforces cash refund if permanent customer owes ৳0
 * - Cash Drawer sync: Decrements branch Cash Drawer on cash refunds
 * - Returns generated return voucher number and completed receipt data for printing
 */
export async function createSaleReturnAction(formData: FormData) {
  try {
    // 1. Zero-Trust Authentication & Active Branch Guard
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.POS_ACCESS,
      requireActiveStatus: true,
    });

    if (!user.activeBranchId) {
      return { success: false, error: "সক্রিয় ব্রাঞ্চ পাওয়া যায়নি।" };
    }

    const saleId = formData.get("saleId")?.toString();
    const refundMethod = (formData.get("refundMethod")?.toString() || "cash").toLowerCase();
    const notes = formData.get("notes")?.toString().trim() || null;

    if (!saleId) return { success: false, error: "চালান আইডি দেওয়া হয়নি।" };

    // 2. Fetch original sale with line items, customer, and prior returns
    const sale = await prisma.sale.findFirst({
      where: {
        id: saleId,
        shopId: user.shopId,
        branchId: user.activeBranchId,
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, purchasePrice: true } },
            unit: { select: { shortCode: true } },
          },
        },
        customer: true,
        returns: { include: { items: true } },
      },
    });

    if (!sale) return { success: false, error: "চালানটি খুঁজে পাওয়া যায়নি।" };

    // 🛡️ GUARD 1: Walk-in customers can NEVER use balance deduction
    const isWalkIn = !sale.customer || sale.customer.type === "WALK_IN";
    if (refundMethod === "balance" && isWalkIn) {
      return {
        success: false,
        error: "খুচরা ক্রেতার (Walk-in) কোনো বাকির খাতা নেই। শুধুমাত্র নগদ ক্যাশ ফেরত (Cash Refund) প্রদান করুন।",
      };
    }

    // 3. Calculate previously returned quantities to prevent double returns
    const alreadyReturnedMap = new Map<string, number>();
    for (const priorReturn of sale.returns) {
      for (const rItem of priorReturn.items) {
        const cur = alreadyReturnedMap.get(rItem.productId) || 0;
        alreadyReturnedMap.set(rItem.productId, cur + Number(rItem.quantity));
      }
    }

    const returnItemsData: {
      productId: string;
      productName: string;
      unitId: string | null;
      unitCode: string;
      quantity: number;
      refundPrice: number;
      purchaseCost: number;
      condition: "RESTOCK" | "DAMAGED";
    }[] = [];

    let totalRefund = 0;
    let totalDamagedLoss = 0;

    for (const item of sale.items) {
      const qtyStr = formData.get(`return_qty_${item.id}`)?.toString();
      const conditionStr = (formData.get(`condition_${item.id}`)?.toString() as "RESTOCK" | "DAMAGED") || "RESTOCK";
      const qty = parseFloat(qtyStr || "0");

      if (qty > 0) {
        const alreadyReturned = alreadyReturnedMap.get(item.productId) || 0;
        const availableQtyToReturn = Number(item.quantity) - alreadyReturned;

        // 🛡️ Anti-Fraud: Cannot return more than eligible remaining
        if (qty > availableQtyToReturn) {
          return {
            success: false,
            error: `সর্বোচ্চ ফেরতযোগ্য পরিমাণ ${availableQtyToReturn}। আপনি ${qty} উল্লেখ করেছেন।`,
          };
        }

        const unitPrice = Number(item.unitPrice);
        const purchaseCost = Number(item.purchaseCost || item.product.purchasePrice || 0);
        const lineRefund = Math.round(qty * unitPrice * 100) / 100;
        totalRefund += lineRefund;

        // If Damaged: track wholesale cost loss
        if (conditionStr === "DAMAGED") {
          const lineLoss = Math.round(qty * purchaseCost * 100) / 100;
          totalDamagedLoss += lineLoss;
        }

        returnItemsData.push({
          productId: item.productId,
          productName: item.product.name,
          unitId: item.unitId,
          unitCode: item.unit?.shortCode || "pcs",
          quantity: qty,
          refundPrice: unitPrice,
          purchaseCost,
          condition: conditionStr,
        });
      }
    }

    if (returnItemsData.length === 0 || totalRefund <= 0) {
      return { success: false, error: "কমপক্ষে একটি পণ্যের ফেরত পরিমাণ উল্লেখ করুন।" };
    }

    // 🛡️ GUARD 2: Customer Khata Balance Validation
    if (refundMethod === "balance" && sale.customer) {
      const customerTotalDue = Number(sale.customer.currentDue || 0);

      if (customerTotalDue <= 0) {
        return {
          success: false,
          error: "কাস্টমারের কোনো বকেয়া বাকি নেই (বকেয়া: ৳0.00)। বাকি সমন্বয় করা সম্ভব নয়, অনুগ্রহ করে নগদ ক্যাশ ফেরত (Cash Refund) প্রদান করুন।",
        };
      }

      if (customerTotalDue < totalRefund) {
        return {
          success: false,
          error: `কাস্টমারের সর্বমোট বকেয়া মাত্র ৳${customerTotalDue.toFixed(2)}। কিন্তু ফেরত বিল ৳${totalRefund.toFixed(2)}। অনুগ্রহ করে নগদ ফেরত প্রদান করুন।`,
        };
      }
    }

    // 🛡️ GUARD 3: Prevent Cash Refund higher than actual cash collected on the invoice
    const salePaid = Number(sale.paidAmount);
    if (refundMethod === "cash" && salePaid < totalRefund) {
      return {
        success: false,
        error: `নগদ ৳${totalRefund.toFixed(2)} ফেরত দেওয়া সম্ভব নয়! কাস্টমার এই চালানে মাত্র ৳${salePaid.toFixed(2)} পরিশোধ করেছিলেন। বাকি সমন্বয় নির্বাচন করুন।`,
      };
    }

    const returnNo = `RET-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    // 4. 🚀 ATOMIC DATABASE TRANSACTION
    await prisma.$transaction(async (tx) => {
      // A. Create Sale Return Record
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

      // B. Process Return Items & Handle Conditions (RESTOCK vs DAMAGED)
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

        // Condition 1: RESTOCK -> Increment shelf inventory in active branch
        if (rItem.condition === "RESTOCK") {
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
        // Condition 2: DAMAGED -> Skipped! (Item remains OUT of sellable stock)
      }

      // C. 👈 AUTOMATED DAMAGE LOSS TRACKING (P&L Protection)
      if (totalDamagedLoss > 0) {
        // Ensure "EXP-DAMAGE" category exists
        let damageCategory = await tx.expenseCategory.findFirst({
          where: { shopId: user.shopId, code: "EXP-DAMAGE" },
        });

        if (!damageCategory) {
          damageCategory = await tx.expenseCategory.create({
            data: {
              name: "নষ্ট ও মেয়াদোত্তীর্ণ পণ্যের ক্ষতি (Damaged Goods Write-Off)",
              code: "EXP-DAMAGE",
              description: "সেলস রিটার্ন থেকে প্রাপ্ত নষ্ট ও বিক্রয়-অনুপযোগী পণ্যের ক্রয়মূল্য ক্ষতি",
              shopId: user.shopId,
              status: "active",
            },
          });
        }

        // Log non-cash expense entry (Reduces net profit accurately without debiting cash drawer)
        await tx.expense.create({
          data: {
            voucherNo: `VCH-DMG-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
            amount: totalDamagedLoss,
            expenseDate: new Date(),
            paymentMethod: "non_cash",
            reference: `Return #${returnNo} (Invoice #${sale.invoiceNo})`,
            note: `নষ্ট পণ্য ফেরত বাবদ ক্রয়মূল্য ক্ষতি: ৳${totalDamagedLoss.toFixed(2)}`,
            categoryId: damageCategory.id,
            branchId: user.activeBranchId,
            shopId: user.shopId,
            userId: user.userId,
          },
        });
      }

      // D. Balance vs Cash Deduction Accounting
      if (refundMethod === "balance") {
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

        // Deduct from customer's khata ledger
        if (sale.customerId) {
          await tx.customer.update({
            where: { id: sale.customerId },
            data: { currentDue: { decrement: totalRefund } },
          });
        }
      } else {
        // Cash Refund: Grand Total & Paid amount decrease
        await tx.sale.update({
          where: { id: sale.id },
          data: {
            grandTotal: { decrement: totalRefund },
            paidAmount: { decrement: totalRefund },
          },
        });

        // 👈 Deduct physical cash from active branch cash drawer account
        const cashDrawer = await tx.account.findFirst({
          where: { branchId: user.activeBranchId, type: "CASH", status: "active" },
        });
        if (cashDrawer) {
          await tx.account.update({
            where: { id: cashDrawer.id },
            data: { currentBalance: { decrement: totalRefund } },
          });
        }
      }
    });

    // 5. Fetch details for printable slip
    const branch = await prisma.branch.findUnique({
      where: { id: user.activeBranchId },
      select: { name: true },
    });

    const cashierUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { name: true },
    });

    const returnData: ICompletedReturn = {
      returnNo,
      invoiceNo: sale.invoiceNo,
      returnDate: new Date(),
      customerName: sale.customer ? sale.customer.name : "নগদ ক্রেতা (Walk-in)",
      totalRefund,
      refundMethod,
      notes,
      branchName: branch?.name || "Main Branch",
      cashierName: cashierUser?.name || "Cashier",
      items: returnItemsData.map((it) => ({
        productName: it.productName,
        quantity: it.quantity,
        unitCode: it.unitCode,
        refundPrice: it.refundPrice,
        lineTotal: Math.round(it.quantity * it.refundPrice * 100) / 100,
        condition: it.condition,
      })),
    };

    // 6. Revalidate Cache
    revalidatePath("/sales-returns");
    revalidatePath("/sales");
    revalidatePath("/pos");
    revalidatePath("/dashboard");
    revalidatePath("/reports/closings");
    revalidatePath("/reports/customers-due");
    revalidatePath("/expenses");

    return {
      success: true,
      returnNo,
      returnData,
    };
  } catch (error: any) {
    console.error("Sale return error:", error);
    return { success: false, error: error.message || "পণ্য ফেরত সম্পন্ন করা সম্ভব হয়নি।" };
  }
}