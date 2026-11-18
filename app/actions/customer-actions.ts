"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { customerSchema } from "@/lib/validations";
import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import { getErrorMessage } from "@/lib/utils";

// ==========================================
// SHARED HELPERS
// ==========================================
const CUSTOMER_REVALIDATE_PATHS = [
  "/dashboard/admin/customers",
  "/reports/customers-due",
];

function revalidateCustomerPaths(extra: string[] = []) {
  for (const path of [...CUSTOMER_REVALIDATE_PATHS, ...extra]) revalidatePath(path);
}

/** Map a customer form to the shape `customerSchema` expects. */
function formToCustomerInput(formData: FormData, includeOpeningBalance = false) {
  return {
    id: formData.get("id")?.toString(),
    name: formData.get("name")?.toString().trim(),
    phone: formData.get("phone")?.toString().trim() || null,
    email: formData.get("email")?.toString().trim() || null,
    type: formData.get("type")?.toString() || "PERMANENT",
    village: formData.get("village")?.toString().trim() || null,
    district: formData.get("district")?.toString().trim() || null,
    addressLine: formData.get("addressLine")?.toString().trim() || null,
    creditLimit: formData.get("creditLimit") || (includeOpeningBalance ? 5000 : 0),
    ...(includeOpeningBalance ? { openingBalance: formData.get("openingBalance") || 0 } : {}),
  };
}

interface CustomerFieldsInput {
  name: string;
  phone?: string | null;
  email?: string | null;
  type: "WALK_IN" | "PERMANENT";
  village?: string | null;
  district?: string | null;
  addressLine?: string | null;
  creditLimit: number;
}

/** Columns shared by create + update. */
function customerFields(data: CustomerFieldsInput) {
  return {
    name: data.name,
    phone: data.phone,
    email: data.email || null,
    type: data.type,
    village: data.village,
    district: data.district,
    address: data.addressLine,
    creditLimit: data.creditLimit,
  };
}

/** Non-owners may only touch customers in their active branch. */
function nonOwnerBranchScope(user: { role: string; activeBranchId: string }) {
  if (user.role === "OWNER") return {};
  return { branchId: user.activeBranchId };
}

// ==========================================
// 1. CREATE CUSTOMER
// ==========================================
export async function createCustomerAction(formData: FormData) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.POS_ACCESS,
      requireActiveStatus: true,
    });

    if (!user.activeBranchId) {
      return { success: false, error: "সক্রিয় ব্রাঞ্চ পাওয়া যায়নি।" };
    }

    const parsed = customerSchema.safeParse(formToCustomerInput(formData, true));
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const data = parsed.data;

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
        ...customerFields(data),
        openingDue: data.openingBalance,
        currentDue: data.openingBalance,
        shopId: user.shopId,
        branchId: user.activeBranchId,
        status: "active",
      },
    });

    revalidateCustomerPaths(["/pos"]);
    return { success: true, customerId: customer.id };
  } catch (error) {
    console.error("createCustomerAction error:", error);
    return { success: false, error: getErrorMessage(error, "Failed to create customer.") };
  }
}

// ==========================================
// 2. UPDATE CUSTOMER
// ==========================================
export async function updateCustomerAction(formData: FormData) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.POS_ACCESS,
      requireActiveStatus: true,
    });

    const id = formData.get("id")?.toString();
    if (!id) return { success: false, error: "Missing customer ID." };

    const parsed = customerSchema.safeParse(formToCustomerInput(formData));
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const data = parsed.data;

    const existing = await prisma.customer.findFirst({
      where: { id, shopId: user.shopId, ...nonOwnerBranchScope(user) },
    });
    if (!existing) {
      return { success: false, error: "Customer not found or unauthorized for this branch." };
    }

    await prisma.customer.update({
      where: { id },
      data: customerFields(data),
    });

    revalidateCustomerPaths();
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Failed to update customer.") };
  }
}

// ==========================================
// 3. RECORD PAYMENT
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
      where: { id: customerId, shopId: user.shopId, ...nonOwnerBranchScope(user) },
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

    revalidateCustomerPaths(["/reports/closings"]);
    return { success: true, receiptNo };
  } catch (error) {
    console.error("recordCustomerPaymentAction error:", error);
    return { success: false, error: getErrorMessage(error, "Failed to record payment.") };
  }
}

// ==========================================
// 4. DELETE CUSTOMER (Owner Only)
// ==========================================
export async function deleteCustomerAction(id: string) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.POS_ACCESS,
      requireActiveStatus: true,
    });

    if (user.role !== "OWNER") {
      return {
        success: false,
        error: "অনুমতি নেই: শুধুমাত্র দোকানের মালিক কাস্টমার প্রোফাইল মুছে ফেলতে পারেন।",
      };
    }

    const customer = await prisma.customer.findFirst({
      where: { id, shopId: user.shopId, branchId: user.activeBranchId },
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

    revalidateCustomerPaths();
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Failed to delete customer.") };
  }
}
