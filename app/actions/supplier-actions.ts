"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import { supplierSchema } from "@/lib/validations";

// ==========================================
// 1. CREATE SUPPLIER (Branch Scoped or Global)
// ==========================================
export async function createSupplierAction(formData: FormData) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });

    const validated = supplierSchema.safeParse({
      name: formData.get("name")?.toString().trim(),
      companyName: formData.get("companyName")?.toString().trim(),
      phone: formData.get("phone")?.toString().trim(),
      email: formData.get("email")?.toString().trim() || null,
      village: formData.get("village")?.toString().trim() || null,
      district: formData.get("district")?.toString().trim() || null,
      addressLine: formData.get("addressLine")?.toString().trim() || null,
      openingBalance: formData.get("openingBalance") || 0,
    });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const data = validated.data;
    const isGlobal = formData.get("isGlobal") === "true";

    const supplier = await prisma.supplier.create({
      data: {
        name: data.name,
        companyName: data.companyName,
        phone: data.phone,
        email: data.email || null,
        village: data.village,
        district: data.district,
        address: data.addressLine,
        openingDue: data.openingBalance,
        currentDue: data.openingBalance,
        shopId: user.shopId,
        branchId: isGlobal ? null : user.activeBranchId,
      },
    });

    revalidatePath("/dashboard/admin/suppliers");
    revalidatePath("/purchases");
    return { success: true, supplierId: supplier.id };
  } catch (error: any) {
    console.error("createSupplierAction error:", error);
    return { success: false, error: error.message || "সরবরাহকারী যোগ করা সম্ভব হয়নি।" };
  }
}

// ==========================================
// 2. UPDATE SUPPLIER
// ==========================================
export async function updateSupplierAction(formData: FormData) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });

    const id = formData.get("id")?.toString();
    if (!id) return { success: false, error: "সাপ্লায়ার আইডি দেওয়া হয়নি।" };

    const validated = supplierSchema.safeParse({
      id,
      name: formData.get("name")?.toString().trim(),
      companyName: formData.get("companyName")?.toString().trim(),
      phone: formData.get("phone")?.toString().trim(),
      email: formData.get("email")?.toString().trim() || null,
      village: formData.get("village")?.toString().trim() || null,
      district: formData.get("district")?.toString().trim() || null,
      addressLine: formData.get("addressLine")?.toString().trim() || null,
    });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const data = validated.data;
    const isGlobal = formData.get("isGlobal") === "true";


    await prisma.supplier.update({
      where: { 
        id, 
        shopId: user.shopId 
      },
      data: {
        name: data.name,
        companyName: data.companyName,
        phone: data.phone,
        email: data.email || null,
        village: data.village,
        district: data.district,
        address: data.addressLine,
        branchId: isGlobal ? null : user.activeBranchId,
      },
    });

    revalidatePath("/dashboard/admin/suppliers");
    revalidatePath("/purchases");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "সাপ্লায়ার আপডেট ব্যর্থ হয়েছে।" };
  }
}

// ==========================================
// 3. DELETE SUPPLIER (Owner Only)
// ==========================================
export async function deleteSupplierAction(id: string) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });

    if (user.role !== "OWNER") {
      return { success: false, error: "অনুমতি নেই: শুধুমাত্র দোকানের মালিক সাপ্লায়ার মুছে ফেলতে পারেন।" };
    }

    const supplier = await prisma.supplier.findFirst({
      where: { id, shopId: user.shopId },
      include: {
        _count: { select: { purchases: true } },
      },
    });

    if (!supplier) return { success: false, error: "সরবরাহকারী পাওয়া যায়নি।" };

    if (Number(supplier.currentDue) > 0) {
      return {
        success: false,
        error: `মুছে ফেলা সম্ভব নয়: ${supplier.companyName || supplier.name} এর নিকট আপনার ৳${Number(supplier.currentDue).toFixed(2)} বকেয়া দেনা রয়েছে। দেনা পরিশোধ করুন।`,
      };
    }

    if (supplier._count.purchases > 0) {
      return {
        success: false,
        error: `মুছে ফেলা সম্ভব নয়: এই সাপ্লায়ারের ${supplier._count.purchases} টি ক্রয় চালান রয়েছে। নিষ্ক্রিয় (Inactive) হিসেবে চিহ্নিত করুন।`,
      };
    }

    await prisma.supplier.delete({ where: { id } });

    revalidatePath("/dashboard/admin/suppliers");
    revalidatePath("/purchases");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "সাপ্লায়ার মুছে ফেলা সম্ভব হয়নি।" };
  }
}

// ==========================================
// 4. RECORD SUPPLIER PAYMENT (WITH ACCOUNT SYNC)
// ==========================================
export interface RecordSupplierPaymentPayload {
  supplierId: string;
  amount: number;
  paymentMethod?: string;
  reference?: string;
  note?: string;
}

export async function recordSupplierPaymentAction(
  payloadOrId: RecordSupplierPaymentPayload | string,
  amountArg?: number,
  paymentMethodArg: string = "cash"
) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });

    if (!user.activeBranchId) {
      return { success: false, error: "সক্রিয় ব্রাঞ্চ পাওয়া যায়নি।" };
    }

    const payload: RecordSupplierPaymentPayload =
      typeof payloadOrId === "string"
        ? {
            supplierId: payloadOrId,
            amount: amountArg ?? 0,
            paymentMethod: paymentMethodArg,
          }
        : payloadOrId;

    const { supplierId, amount, paymentMethod = "cash", reference, note } = payload;
    const sAmount = Math.max(0, Number(amount) || 0);

    if (sAmount <= 0) {
      return { success: false, error: "পরিশোধের পরিমাণ অবশ্যই শূন্যের চেয়ে বেশি হতে হবে।" };
    }

    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, shopId: user.shopId },
    });
    if (!supplier) return { success: false, error: "সাপ্লায়ার পাওয়া যায়নি।" };

    const voucherNo = `PAY-VCH-${Date.now().toString().slice(-6)}`;
    const previousDue = Number(supplier.currentDue);
    const remainingDue = Math.max(0, previousDue - sAmount);

    // 🚀 ATOMIC TRANSACTION: Voucher + Ledger decrement + Drawer Cash deduction
    const payment = await prisma.$transaction(async (tx) => {
      // 1. Create Supplier Payment Voucher
      const p = await tx.supplierPayment.create({
        data: {
          amount: sAmount,
          paymentMethod,
          voucherNo,
          reference: reference || null,
          note: note || "মহাজনের বকেয়া পরিশোধ (Supplier Due Payout)",
          supplierId,
          branchId: user.activeBranchId,
        },
      });

      // 2. Decrement Supplier Ledger Debt
      await tx.supplier.update({
        where: { id: supplierId },
        data: {
          currentDue: { decrement: sAmount },
        },
      });

      // 3. 👈 DEDUCT CASH FROM DRAWER / BANK ACCOUNT (Real Financial Sync)
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
          data: { currentBalance: { decrement: sAmount } },
        });
      }

      return p;
    });

    revalidatePath("/purchases");
    revalidatePath("/dashboard/admin/suppliers");
    revalidatePath("/reports/closings"); // 👈 Realtime Z-Report cashSupplierPaid update!
    revalidatePath("/reports/purchases");

    return {
      success: true,
      voucherNo,
      supplierName: supplier.name,
      companyName: supplier.companyName,
      phone: supplier.phone,
      previousDue,
      amountPaid: sAmount,
      remainingDue,
      paymentMethod,
      reference,
      paymentDate: payment.createdAt,
    };
  } catch (error: any) {
    console.error("Supplier payment error:", error);
    return { success: false, error: error.message || "পেমেন্ট সম্পন্ন করা সম্ভব হয়নি।" };
  }
}

// ==========================================
// 5. SUPPLIER PAYMENT HISTORY
// ==========================================
export async function getSupplierPaymentHistoryAction(supplierId: string) {
  try {
    const user = await requireAuth();

    const payments = await prisma.supplierPayment.findMany({
      where: {
        supplierId,
        supplier: { shopId: user.shopId },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: payments.map((p) => ({
        id: p.id,
        voucherNo: p.voucherNo,
        amount: Number(p.amount),
        paymentMethod: p.paymentMethod,
        reference: p.reference,
        note: p.note,
        createdAt: p.createdAt,
      })),
    };
  } catch (error: any) {
    return { success: false, error: error.message || "পেমেন্ট লেজার লোড ব্যর্থ হয়েছে।" };
  }
}