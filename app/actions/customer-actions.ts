"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { customerSchema } from "@/lib/validations";

// Helper: Extracts authenticated user and verifies active branch
async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.shopId) {
    throw new Error("Unauthorized: Please log in.");
  }

  // Fail-safe: If session branchId is missing, pull from DB
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
// 1. CREATE CUSTOMER (Tagged with branchId)
// ==========================================
export async function createCustomerAction(formData: FormData) {
  try {
    const user = await getAuthenticatedUser();

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
    
    // Optional: Check if marked as global (e.g. from an isGlobal checkbox)
    const isGlobal = formData.get("isGlobal") === "true";

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
        // 👈 TAG WITH ACTIVE BRANCH: null if global, otherwise current branch
        branchId: isGlobal ? null : user.branchId,
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
// 2. UPDATE CUSTOMER (Multi-tenant guarded)
// ==========================================
export async function updateCustomerAction(formData: FormData) {
  try {
    const user = await getAuthenticatedUser();

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

    // 👈 Multi-tenant check: ID + shopId
    await prisma.customer.update({
      where: { 
        id, 
        shopId: user.shopId 
      },
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
    const user = await getAuthenticatedUser();

    if (!amount || amount <= 0) {
      return { success: false, error: "Please enter a valid payment amount." };
    }

    const customer = await prisma.customer.findFirst({
      where: { id: customerId, shopId: user.shopId },
    });
    if (!customer) return { success: false, error: "Customer not found." };

    const receiptNo = `REC-${Date.now().toString().slice(-6)}`;

    // 👈 ATOMIC TRANSACTION: Decrement Due + Create Payment Record
    await prisma.$transaction(async (tx) => {
      // 1. Decrement Customer Due
      await tx.customer.update({
        where: { id: customerId },
        data: {
          currentDue: { decrement: amount },
        },
      });

      // 2. Create CustomerPayment record linked to active branch
      await tx.customerPayment.create({
        data: {
          receiptNo,
          amount,
          paymentMethod,
          note: note || "কাস্টমার বকেয়া কালেকশন (Due Collection)",
          branchId: user.branchId!, // 👈 Connects payment to active branch
          customerId: customer.id,
        },
      });
    });

    revalidatePath("/dashboard/admin/customers");
    revalidatePath("/reports/customers-due");
    revalidatePath("/reports/closings"); // Updates Z-Report live cash collections!
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
    const user = await getAuthenticatedUser();

    const customer = await prisma.customer.findFirst({
      where: { id, shopId: user.shopId },
      include: {
        _count: {
          select: { sales: true },
        },
      },
    });

    if (!customer) return { success: false, error: "Customer not found." };

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