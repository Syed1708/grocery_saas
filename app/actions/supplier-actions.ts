"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { supplierSchema } from "@/lib/validations";

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.shopId) {
    throw new Error("Unauthorized: Please log in.");
  }

  // Fail-safe: Ensure active branch is resolved
  let branchId = session.user.branchId;
  if (!branchId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { branchId: true },
    });
    branchId = dbUser?.branchId || null;
  }

  return {
    ...session.user,
    branchId,
  };
}

// ==========================================
// 1. CREATE SUPPLIER (Tagged with branchId)
// ==========================================
export async function createSupplierAction(formData: FormData) {
  try {
    const user = await getAuthenticatedUser();

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
    
    // Check if user toggled "Global Corporate Supplier" (e.g. Unilever, Pran)
    const isGlobal = formData.get("isGlobal") === "true";

    await prisma.supplier.create({
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
        // 👈 TAG WITH BRANCH: null if global distributor, otherwise active branch
        branchId: isGlobal ? null : user.branchId,
      },
    });

    revalidatePath("/dashboard/admin/suppliers");
    revalidatePath("/admin/suppliers");
    return { success: true };
  } catch (error: any) {
    console.error("createSupplierAction error:", error);
    return { success: false, error: error.message || "Failed to create supplier." };
  }
}

// ==========================================
// 2. UPDATE SUPPLIER (Multi-tenant guarded)
// ==========================================
export async function updateSupplierAction(formData: FormData) {
  try {
    const user = await getAuthenticatedUser();

    const id = formData.get("id")?.toString();
    if (!id) return { success: false, error: "Missing supplier ID." };

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

    // 👈 Multi-tenant check: ID + shopId
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
      },
    });

    revalidatePath("/dashboard/admin/suppliers");
    revalidatePath("/admin/suppliers");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update supplier." };
  }
}

// ==========================================
// 3. DELETE SUPPLIER (Safe guarded)
// ==========================================
export async function deleteSupplierAction(id: string) {
  try {
    const user = await getAuthenticatedUser();

    const supplier = await prisma.supplier.findFirst({
      where: { id, shopId: user.shopId },
      include: {
        _count: {
          select: { purchases: true },
        },
      },
    });

    if (!supplier) return { success: false, error: "Supplier not found." };

    if (Number(supplier.currentDue) > 0) {
      return {
        success: false,
        error: `Cannot delete: You owe ${supplier.companyName || supplier.name} an unpaid balance of ৳${Number(supplier.currentDue).toFixed(2)}. Settle the balance first.`,
      };
    }

    if (supplier._count.purchases > 0) {
      return {
        success: false,
        error: `Cannot delete: ${supplier.companyName || supplier.name} has ${supplier._count.purchases} purchase chalans in system. Mark supplier inactive instead.`,
      };
    }

    await prisma.supplier.delete({ where: { id } });

    revalidatePath("/dashboard/admin/suppliers");
    revalidatePath("/admin/suppliers");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete supplier." };
  }
}

// ==========================================
// 4. RECORD PAYMENT (Supports both 1 object OR 3 arguments)
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
    const user = await getAuthenticatedUser();

    // 👈 Polyfill: Supports both recordSupplierPaymentAction(id, amount, method) AND recordSupplierPaymentAction({ ... })
    const payload: RecordSupplierPaymentPayload =
      typeof payloadOrId === "string"
        ? {
            supplierId: payloadOrId,
            amount: amountArg ?? 0,
            paymentMethod: paymentMethodArg,
          }
        : payloadOrId;

    const { supplierId, amount, paymentMethod = "cash", reference, note } = payload;

    if (!amount || amount <= 0) {
      return { success: false, error: "Please enter a valid payment amount." };
    }

    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, shopId: user.shopId },
    });
    if (!supplier) return { success: false, error: "Supplier not found." };

    // Resolve branch for payment
    let activeBranchId = user.branchId;
    if (!activeBranchId) {
      const mainBranch = await prisma.branch.findFirst({
        where: { shopId: user.shopId, isMain: true },
        select: { id: true },
      });
      activeBranchId = mainBranch?.id || null;
    }

    if (!activeBranchId) {
      return { success: false, error: "Active branch required to record cash payout." };
    }

    const voucherNo = `PV-${Date.now().toString().slice(-6)}`;
    const previousDue = Number(supplier.currentDue);
    const remainingDue = Math.max(0, previousDue - amount);

    // Atomic Transaction: SupplierPayment voucher + decrement supplier debt
    const payment = await prisma.$transaction(async (tx) => {
      const p = await tx.supplierPayment.create({
        data: {
          amount,
          paymentMethod,
          voucherNo,
          reference: reference || null,
          note: note || "Supplier due payment (মহাজনের বাকি পরিশোধ)",
          supplierId,
          branchId: activeBranchId,
        },
      });

      await tx.supplier.update({
        where: { id: supplierId },
        data: {
          currentDue: { decrement: amount },
        },
      });

      return p;
    });

    revalidatePath("/dashboard/admin/purchases");
    revalidatePath("/dashboard/admin/suppliers");
    revalidatePath("/reports/closings"); // 👈 Immediately updates Day-End Z-Report (cashSupplierPaid)!
    revalidatePath("/reports/purchases");

    return {
      success: true,
      voucherNo,
      supplierName: supplier.name,
      companyName: supplier.companyName,
      phone: supplier.phone,
      previousDue,
      amountPaid: amount,
      remainingDue,
      paymentMethod,
      reference,
      paymentDate: payment.createdAt,
    };
  } catch (error: any) {
    console.error("Supplier payment error:", error);
    return { success: false, error: error.message || "Failed to record payment." };
  }
}

// ==========================================
// 5. SUPPLIER PAYMENT HISTORY LEDGER
// ==========================================
export async function getSupplierPaymentHistoryAction(supplierId: string) {
  try {
    const user = await getAuthenticatedUser();

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
    return { success: false, error: error.message || "Failed to fetch payment ledger." };
  }
}