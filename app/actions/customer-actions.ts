"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { customerSchema } from "@/lib/validations";

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.shopId) {
    throw new Error("Unauthorized: Please log in.");
  }
  return session.user;
}

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
        currentDue: data.openingBalance, // 👈 Saved as currentDue in MySQL
        shopId: user.shopId,
      },
    });

    revalidatePath("/dashboard/admin/customers");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create customer." };
  }
}

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
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update customer." };
  }
}

export async function recordCustomerPaymentAction(customerId: string, amount: number) {
  try {
    const user = await getAuthenticatedUser();

    if (!amount || amount <= 0) {
      return { success: false, error: "Please enter a valid payment amount." };
    }

    const customer = await prisma.customer.findFirst({
      where: { id: customerId, shopId: user.shopId },
    });
    if (!customer) return { success: false, error: "Customer not found." };

    await prisma.customer.update({
      where: { id: customerId },
      data: {
        currentDue: { decrement: amount }, // 👈 Decrements currentDue
      },
    });

    revalidatePath("/dashboard/admin/customers");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to record payment." };
  }
}

export async function deleteCustomerAction(id: string) {
  try {
    const user = await getAuthenticatedUser();

    const customer = await prisma.customer.findFirst({
      where: { id, shopId: user.shopId },
    });
    if (!customer) return { success: false, error: "Customer not found." };

    if (Number(customer.currentDue) > 0) {
      return {
        success: false,
        error: `Cannot delete: ${customer.name} owes ${customer.currentDue} in unpaid credit. Settle the balance first.`,
      };
    }

    await prisma.customer.delete({ where: { id } });

    revalidatePath("/dashboard/admin/customers");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete customer." };
  }
}