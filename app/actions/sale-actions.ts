"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import { CheckoutPayload, ISplitPaymentDetails } from "@/types/sale";

/**
 * 1. CHECKOUT SALE ACTION
 * - Re-evaluates all prices from MySQL (Prevents client-side price tampering)
 * - Atomic conditional row-lock stock decrement (Prevents negative inventory race conditions)
 * - Real-time Cash Drawer (Account) and MFS Account increment
 * - Customer Khata protection (Change returned does NOT decrement historical debt)
 * - Structured split payment tracking (Cash + bKash + Bank)
 */
export async function checkoutAction(payload: CheckoutPayload) {
  try {
    // 🛡️ Zero-Trust Guard: Resolve authenticated user & active branch securely
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.POS_ACCESS,
      requireActiveStatus: true,
    });

    if (!user.activeBranchId) {
      return { success: false, error: "সক্রিয় ব্রাঞ্চ নির্ধারণ করা নেই।" };
    }

    const {
      customerId,
      items,
      discount = 0,
      cashPaid = 0,
      bkashPaid = 0,
      bankPaid = 0,
    } = payload;

    if (!items || items.length === 0) {
      return { success: false, error: "কার্ট খালি! পণ্য যোগ করুন।" };
    }

    // Fetch Shop VAT Settings
    const shop = await prisma.shop.findUnique({
      where: { id: user.shopId },
      select: { enableVat: true, vatPercent: true },
    });
    const activeVatPercent = shop?.enableVat ? Number(shop.vatPercent || 0) : 0;

    // Fetch Real Products from MySQL (Zero-Trust Price Verification)
    const productIds = items.map((i) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds }, shopId: user.shopId },
      include: {
        stocks: { where: { branchId: user.activeBranchId } },
      },
    });

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    let subtotal = 0;
    const verifiedItems: {
      productId: string;
      unitId: string;
      quantity: number;
      unitPrice: number;
      purchaseCost: number;
      lineTotal: number;
      productName: string;
    }[] = [];

    for (const item of items) {
      const qty = Number(item.quantity);
      if (qty <= 0 || isNaN(qty)) {
        return { success: false, error: "পণ্যের পরিমাণ অবশ্যই শূন্যের চেয়ে বেশি হতে হবে।" };
      }

      const product = productMap.get(item.productId);
      if (!product) {
        return { success: false, error: `পণ্য পাওয়া যায়নি: ${item.productId}` };
      }

      const unitPrice = Number(product.sellingPrice);
      const purchaseCost = Number(product.purchasePrice);
      const lineTotal = Math.round(qty * unitPrice * 100) / 100;
      subtotal += lineTotal;

      verifiedItems.push({
        productId: product.id,
        unitId: product.unitId,
        quantity: qty,
        unitPrice,
        purchaseCost,
        lineTotal,
        productName: product.name,
      });
    }

    // Financial Computations
    const sanitizedDiscount = Math.max(0, Math.min(Number(discount) || 0, subtotal));
    const baseAmount = subtotal - sanitizedDiscount;
    const vatAmount = Math.round(((baseAmount * activeVatPercent) / 100) * 100) / 100;
    const grandTotal = Math.round((baseAmount + vatAmount) * 100) / 100;

    const sCashPaid = Math.max(0, Number(cashPaid) || 0);
    const sBkashPaid = Math.max(0, Number(bkashPaid) || 0);
    const sBankPaid = Math.max(0, Number(bankPaid) || 0);
    const totalPaid = sCashPaid + sBkashPaid + sBankPaid;

    const currentInvoiceDue = Math.max(0, Math.round((grandTotal - totalPaid) * 100) / 100);
    const changeAmount = Math.max(0, Math.round((totalPaid - grandTotal) * 100) / 100);

    let paymentStatus: "paid" | "partial" | "due" = "paid";
    if (currentInvoiceDue > 0) {
      paymentStatus = totalPaid > 0 ? "partial" : "due";
    }

    const paidMethods = [
      sCashPaid > 0 && "cash",
      sBkashPaid > 0 && "bkash",
      sBankPaid > 0 && "bank",
    ].filter(Boolean);

    let paymentMethod = "cash";
    if (paidMethods.length > 1) paymentMethod = "mixed";
    else if (paidMethods.length === 1) paymentMethod = paidMethods[0] as string;
    else if (currentInvoiceDue > 0) paymentMethod = "due";

    // Credit Limit Verification for Customer Dues
    if (currentInvoiceDue > 0) {
      if (!customerId) {
        return { success: false, error: "খুচরা ক্রেতার কাছে বাকি বিক্রয় সম্ভব নয়। স্থায়ী কাস্টমার নির্বাচন করুন।" };
      }
      const customer = await prisma.customer.findUnique({ where: { id: customerId } });
      if (!customer) {
        return { success: false, error: "কাস্টমার অ্যাকাউন্ট পাওয়া যায়নি।" };
      }
      const allowedCredit = Number(customer.creditLimit) - Number(customer.currentDue);
      if (currentInvoiceDue > allowedCredit) {
        return { success: false, error: `ক্রেডিট লিমিট অতিক্রম করেছে! অবশিষ্ট অনুমোদিত বাকি: ৳${allowedCredit.toFixed(2)}` };
      }
    }

    const invoiceNo = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    // Prepare structured metadata for split payment reproduction on receipts
    const splitTag = `SPLIT:{"cash":${sCashPaid},"bkash":${sBkashPaid},"bank":${sBankPaid}}`;

    // 🚀 ATOMIC DATABASE TRANSACTION
    const sale = await prisma.$transaction(async (tx) => {
      // 1. Create Sale Header
      const createdSale = await tx.sale.create({
        data: {
          invoiceNo,
          subtotal,
          discount: sanitizedDiscount,
          vatPercent: activeVatPercent,
          vatAmount,
          grandTotal,
          paidAmount: Math.min(totalPaid, grandTotal),
          dueAmount: currentInvoiceDue,
          changeAmount,
          paymentMethod,
          paymentStatus,
          notes: splitTag,
          branchId: user.activeBranchId,
          customerId: customerId || null,
          userId: user.userId,
          shopId: user.shopId,
          items: {
            create: verifiedItems.map((vi) => ({
              productId: vi.productId,
              unitId: vi.unitId,
              quantity: vi.quantity,
              unitPrice: vi.unitPrice,
              purchaseCost: vi.purchaseCost,
              lineTotal: vi.lineTotal,
            })),
          },
        },
      });

      // 2. Atomic Inventory Deduction with Row-Lock Protection
      for (const item of verifiedItems) {
        const updateResult = await tx.productStock.updateMany({
          where: {
            productId: item.productId,
            branchId: user.activeBranchId,
            quantity: { gte: item.quantity }, // 🛡️ Rejects transaction if another counter sold the last stock
          },
          data: {
            quantity: { decrement: item.quantity },
          },
        });

        if (updateResult.count === 0) {
          throw new Error(`স্টক ঘাটতি! "${item.productName}" এর পর্যাপ্ত স্টক নেই।`);
        }
      }

      // 3. Customer Due Adjustment (Strictly attaches to this invoice)
      if (customerId && currentInvoiceDue > 0) {
        await tx.customer.update({
          where: { id: customerId },
          data: { currentDue: { increment: currentInvoiceDue } },
        });
      }

      // 4. Update Cash Drawer Account (Real Physical Cash Collected)
      const actualCashIn = Math.max(0, sCashPaid - changeAmount);
      if (actualCashIn > 0) {
        const cashDrawer = await tx.account.findFirst({
          where: { branchId: user.activeBranchId, type: "CASH", status: "active" },
        });
        if (cashDrawer) {
          await tx.account.update({
            where: { id: cashDrawer.id },
            data: { currentBalance: { increment: actualCashIn } },
          });
        }
      }

      // 5. Update bKash/MFS Account
      if (sBkashPaid > 0) {
        const bkashAcc = await tx.account.findFirst({
          where: { branchId: user.activeBranchId, type: "BKASH", status: "active" },
        });
        if (bkashAcc) {
          await tx.account.update({
            where: { id: bkashAcc.id },
            data: { currentBalance: { increment: sBkashPaid } },
          });
        }
      }

      // 6. Update Bank/Card Account
      if (sBankPaid > 0) {
        const bankAcc = await tx.account.findFirst({
          where: { branchId: user.activeBranchId, type: "BANK", status: "active" },
        });
        if (bankAcc) {
          await tx.account.update({
            where: { id: bankAcc.id },
            data: { currentBalance: { increment: sBankPaid } },
          });
        }
      }

      return createdSale;
    });

    revalidatePath("/pos");
    revalidatePath("/sales");
    revalidatePath("/dashboard");
    revalidatePath("/reports/closings");
    revalidatePath("/dashboard/admin/customers");

    return {
      success: true,
      saleId: sale.id,
      invoiceNo: sale.invoiceNo,
      grandTotal,
      changeAmount,
    };
  } catch (error: any) {
    console.error("POS Checkout Error:", error);
    return { success: false, error: error.message || "বিক্রয় সম্পন্ন করা সম্ভব হয়নি।" };
  }
}

/**
 * 2. VOID / DELETE SALE ACTION (OWNER ONLY)
 * - Atomic rollback of stock to active branch
 * - Rollback of customer due
 * - Rollback of Cash Drawer & MFS balances
 */
export async function voidSaleAction(saleId: string) {
  try {
    const user = await requireAuth();

    // 🛡️ Strict Zero-Trust Guard: ONLY Store Owner can void sales
    if (user.role !== "OWNER") {
      return { success: false, error: "অনুমতি নেই: শুধুমাত্র দোকানের মালিক বিক্রয় চালান বাতিল বা মুছে ফেলতে পারেন।" };
    }

    const sale = await prisma.sale.findUnique({
      where: { id: saleId, shopId: user.shopId },
      include: {
        items: true,
        returns: true,
      },
    });

    if (!sale) {
      return { success: false, error: "বিক্রয় চালানটি খুঁজে পাওয়া যায়নি।" };
    }

    if (sale.returns.length > 0) {
      return {
        success: false,
        error: "এই চালানের বিপরীতে ইতোমধ্যে সেলস রিটার্ন সম্পন্ন করা হয়েছে। চালানটি সরাসরি মুছে ফেলা সম্ভব নয়।",
      };
    }

    // Parse split payment from notes to rollback exact accounts
    let split: ISplitPaymentDetails = { cash: 0, bkash: 0, bank: 0 };
    if (sale.notes && sale.notes.includes("SPLIT:")) {
      try {
        const jsonStr = sale.notes.split("SPLIT:")[1]?.split("|")[0]?.trim();
        if (jsonStr) split = JSON.parse(jsonStr);
      } catch {}
    } else if (sale.paymentMethod === "cash") {
      split.cash = Number(sale.paidAmount);
    } else if (sale.paymentMethod === "bkash") {
      split.bkash = Number(sale.paidAmount);
    } else if (sale.paymentMethod === "bank") {
      split.bank = Number(sale.paidAmount);
    }

    // 🚀 ATOMIC ROLLBACK TRANSACTION
    await prisma.$transaction(async (tx) => {
      // 1. Rollback Product Stock to the branch
      for (const item of sale.items) {
        await tx.productStock.update({
          where: {
            productId_branchId: {
              productId: item.productId,
              branchId: sale.branchId,
            },
          },
          data: {
            quantity: { increment: item.quantity },
          },
        });
      }

      // 2. Rollback Customer Due
      if (sale.customerId && Number(sale.dueAmount) > 0) {
        await tx.customer.update({
          where: { id: sale.customerId },
          data: {
            currentDue: { decrement: sale.dueAmount },
          },
        });
      }

      // 3. Rollback Cash Drawer Balance
      const netCashPaid = Math.max(0, (split.cash || 0) - Number(sale.changeAmount || 0));
      if (netCashPaid > 0) {
        const cashDrawer = await tx.account.findFirst({
          where: { branchId: sale.branchId, type: "CASH", status: "active" },
        });
        if (cashDrawer) {
          await tx.account.update({
            where: { id: cashDrawer.id },
            data: { currentBalance: { decrement: netCashPaid } },
          });
        }
      }

      // 4. Rollback bKash Account
      if ((split.bkash || 0) > 0) {
        const bkashAcc = await tx.account.findFirst({
          where: { branchId: sale.branchId, type: "BKASH", status: "active" },
        });
        if (bkashAcc) {
          await tx.account.update({
            where: { id: bkashAcc.id },
            data: { currentBalance: { decrement: split.bkash } },
          });
        }
      }

      // 5. Rollback Bank Account
      if ((split.bank || 0) > 0) {
        const bankAcc = await tx.account.findFirst({
          where: { branchId: sale.branchId, type: "BANK", status: "active" },
        });
        if (bankAcc) {
          await tx.account.update({
            where: { id: bankAcc.id },
            data: { currentBalance: { decrement: split.bank } },
          });
        }
      }

      // 6. Delete Sale Items and Sale Record
      await tx.saleItem.deleteMany({ where: { saleId: sale.id } });
      await tx.sale.delete({ where: { id: sale.id } });
    });

    revalidatePath("/sales");
    revalidatePath("/pos");
    revalidatePath("/dashboard");
    revalidatePath("/reports/closings");
    revalidatePath("/dashboard/admin/customers");

    return { success: true };
  } catch (error: any) {
    console.error("voidSaleAction error:", error);
    return { success: false, error: error.message || "চালান বাতিল করা ব্যর্থ হয়েছে।" };
  }
}