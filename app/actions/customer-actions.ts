"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { customerSchema } from "@/lib/validations";
import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";

// ==========================================
// 1. CREATE CUSTOMER (Strict Branch Locked)
// ==========================================
export async function createCustomerAction(formData: FormData) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });

    // Zero-Trust Guard: Customer MUST be linked to an active branch
    if (!user.activeBranchId) {
      return { success: false, error: "Active branch context is required to register a customer." };
    }

    const validated = customerSchema.safeParse({
      name: formData.get("name")?.toString().trim(),
      phone: formData.get("phone")?.toString().trim() || null,
      email: formData.get("email")?.toString().trim() || null,
      type: formData.get("type")?.toString() || "PERMANENT",
      village: formData.get("village")?.toString().trim() || null,
      district: formData.get("district")?.toString().trim() || null,
      addressLine: formData.get("addressLine")?.toString().trim() || null,
      creditLimit: formData.get("creditLimit") || 0,
      openingBalance: formData.get("openingBalance") || 0,
    });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const data = validated.data;

    // Optional: Check if phone already registered in this branch
    if (data.phone) {
      const existing = await prisma.customer.findFirst({
        where: {
          shopId: user.shopId,
          branchId: user.activeBranchId,
          phone: data.phone,
        },
      });
      if (existing) {
        return { success: false, error: `Customer with phone ${data.phone} already exists in this branch.` };
      }
    }

    await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        type: data.type,
        village: data.village,
        district: data.district,
        address: data.addressLine,
        creditLimit: data.creditLimit,
        openingDue: data.openingBalance,
        currentDue: data.openingBalance,
        shopId: user.shopId,
        branchId: user.activeBranchId, // 👈 STRICT: Always tied to active branch
        status: "active",
      },
    });

    revalidatePath("/dashboard/admin/customers");
    revalidatePath("/reports/customers-due");
    return { success: true };
  } catch (error: any) {
    console.error("createCustomerAction error:", error);
    return { success: false, error: error.message || "Failed to create customer." };
  }
}

// ==========================================
// 2. UPDATE CUSTOMER (Branch Isolated)
// ==========================================
export async function updateCustomerAction(formData: FormData) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });

    const id = formData.get("id")?.toString();
    if (!id) return { success: false, error: "Missing customer ID." };

    const validated = customerSchema.safeParse({
      id,
      name: formData.get("name")?.toString().trim(),
      phone: formData.get("phone")?.toString().trim() || null,
      email: formData.get("email")?.toString().trim() || null,
      type: formData.get("type")?.toString() || "PERMANENT",
      village: formData.get("village")?.toString().trim() || null,
      district: formData.get("district")?.toString().trim() || null,
      addressLine: formData.get("addressLine")?.toString().trim() || null,
      creditLimit: formData.get("creditLimit") || 0,
    });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const data = validated.data;

    // Zero-Trust Guard: Non-owners can only edit their own branch's customers
    const existing = await prisma.customer.findFirst({
      where: {
        id,
        shopId: user.shopId,
        ...(user.role !== "OWNER" && user.activeBranchId ? { branchId: user.activeBranchId } : {}),
      },
    });

    if (!existing) {
      return { success: false, error: "Customer not found or unauthorized for this branch." };
    }

    await prisma.customer.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        type: data.type,
        village: data.village,
        district: data.district,
        address: data.addressLine,
        creditLimit: data.creditLimit,
      },
    });

    revalidatePath("/dashboard/admin/customers");
    revalidatePath("/reports/customers-due");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update customer." };
  }
}

// ==========================================
// 3. RECORD PAYMENT (Atomic with CustomerPayment)
// ==========================================
export async function recordCustomerPaymentAction(
  customerId: string, 
  amount: number,
  paymentMethod: string = "cash",
  note?: string
) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });

    if (!user.activeBranchId) {
      return { success: false, error: "Active branch context required." };
    }

    if (!amount || amount <= 0) {
      return { success: false, error: "Please enter a valid payment amount." };
    }

    // Verify customer belongs to this branch (or shop for Owner)
    const customer = await prisma.customer.findFirst({
      where: { 
        id: customerId, 
        shopId: user.shopId,
        ...(user.role !== "OWNER" ? { branchId: user.activeBranchId } : {}),
      },
    });
    if (!customer) return { success: false, error: "Customer not found in this branch." };

    const receiptNo = `REC-${Date.now().toString().slice(-6)}`;

    // ATOMIC TRANSACTION: Decrement Due + Create Payment Record in this branch
    await prisma.$transaction(async (tx) => {
      await tx.customer.update({
        where: { id: customerId },
        data: {
          currentDue: { decrement: amount },
        },
      });

      await tx.customerPayment.create({
        data: {
          receiptNo,
          amount,
          paymentMethod,
          note: note || "কাস্টমার বকেয়া কালেকশন (Due Collection)",
          branchId: user.activeBranchId!, // Payments enter this branch's drawer
          customerId: customer.id,
        },
      });
    });

    revalidatePath("/dashboard/admin/customers");
    revalidatePath("/reports/customers-due");
    revalidatePath("/reports/closings");
    return { success: true, receiptNo };
  } catch (error: any) {
    console.error("recordCustomerPaymentAction error:", error);
    return { success: false, error: error.message || "Failed to record payment." };
  }
}

// ==========================================
// 4. DELETE CUSTOMER (Safe Guarded)
// ==========================================
export async function deleteCustomerAction(id: string) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });

    const customer = await prisma.customer.findFirst({
      where: { 
        id, 
        shopId: user.shopId,
        ...(user.role !== "OWNER" && user.activeBranchId ? { branchId: user.activeBranchId } : {}),
      },
      include: {
        _count: {
          select: { sales: true },
        },
      },
    });

    if (!customer) return { success: false, error: "Customer not found or unauthorized for this branch." };

    if (Number(customer.currentDue) > 0) {
      return {
        success: false,
        error: `Cannot delete: ${customer.name} owes ৳${Number(customer.currentDue).toFixed(2)} in unpaid credit. Settle the balance first.`,
      };
    }

    if (customer._count.sales > 0) {
      return {
        success: false,
        error: `Cannot delete: ${customer.name} has ${customer._count.sales} purchase invoices in system. Mark customer inactive instead.`,
      };
    }

    await prisma.customer.delete({ where: { id } });

    revalidatePath("/dashboard/admin/customers");
    revalidatePath("/reports/customers-due");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete customer." };
  }
}