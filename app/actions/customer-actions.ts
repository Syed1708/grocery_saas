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
      requiredPermission: PERMISSIONS.POS_ACCESS, // Cashiers can register customers
      requireActiveStatus: true,
    });

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
      creditLimit: formData.get("creditLimit") || 5000,
      openingBalance: formData.get("openingBalance") || 0,
    });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const data = validated.data;

    // Check duplicate phone in this branch
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

    const customer = await prisma.customer.create({
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
        branchId: user.activeBranchId,
        status: "active",
      },
    });

    revalidatePath("/dashboard/admin/customers");
    revalidatePath("/pos");
    revalidatePath("/reports/customers-due");

    // 👈 RETURN customerId so POS auto-selects it!
    return { success: true, customerId: customer.id };
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
      requiredPermission: PERMISSIONS.CATALOG_VIEW,
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
// 3. RECORD PAYMENT (Atomic with CustomerPayment & Account)
// ==========================================
export async function recordCustomerPaymentAction(
  customerId: string, 
  amount: number,
  paymentMethod: string = "cash",
  note?: string
) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.POS_ACCESS,
      requireActiveStatus: true,
    });

    if (!user.activeBranchId) {
      return { success: false, error: "Active branch context required." };
    }

    if (!amount || amount <= 0) {
      return { success: false, error: "Please enter a valid payment amount." };
    }

    const customer = await prisma.customer.findFirst({
      where: { 
        id: customerId, 
        shopId: user.shopId,
        ...(user.role !== "OWNER" ? { branchId: user.activeBranchId } : {}),
      },
    });
    if (!customer) return { success: false, error: "Customer not found in this branch." };

    const receiptNo = `REC-${Date.now().toString().slice(-6)}`;

    await prisma.$transaction(async (tx) => {
      // 1. Decrement Customer Due
      await tx.customer.update({
        where: { id: customerId },
        data: { currentDue: { decrement: amount } },
      });

      // 2. Create Payment Record
      await tx.customerPayment.create({
        data: {
          receiptNo,
          amount,
          paymentMethod,
          note: note || "কাস্টমার বকেয়া কালেকশন (Due Collection)",
          branchId: user.activeBranchId,
          customerId: customer.id,
        },
      });

      // 3. Increment Branch Cash Drawer if paid in cash
      if (paymentMethod === "cash") {
        const cashDrawer = await tx.account.findFirst({
          where: { branchId: user.activeBranchId, type: "CASH", status: "active" },
        });
        if (cashDrawer) {
          await tx.account.update({
            where: { id: cashDrawer.id },
            data: { currentBalance: { increment: amount } },
          });
        }
      }
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
      requiredPermission: PERMISSIONS.FINANCE_LOANS,
      requireActiveStatus: true,
    });

    const customer = await prisma.customer.findFirst({
      where: { 
        id, 
        shopId: user.shopId,
        ...(user.role !== "OWNER" && user.activeBranchId ? { branchId: user.activeBranchId } : {}),
      },
      include: {
        _count: { select: { sales: true } },
      },
    });

    if (!customer) return { success: false, error: "Customer not found or unauthorized for this branch." };

    if (Number(customer.currentDue) > 0) {
      return {
        success: false,
        error: `Cannot delete: ${customer.name} owes ৳${Number(customer.currentDue).toFixed(2)} in unpaid credit.`,
      };
    }

    if (customer._count.sales > 0) {
      return {
        success: false,
        error: `Cannot delete: ${customer.name} has ${customer._count.sales} invoices on record. Mark customer inactive instead.`,
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