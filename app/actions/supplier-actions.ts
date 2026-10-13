"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { supplierSchema } from "@/lib/validations";

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.shopId) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

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
        currentDue: data.openingBalance, // 👈 Saved as currentDue
        shopId: user.shopId,
      },
    });

    revalidatePath("/dashboard/admin/suppliers");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create supplier." };
  }
}

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

    await prisma.supplier.update({
      where: { id },
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
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update supplier." };
  }
}

export async function recordSupplierPaymentAction(supplierId: string, amount: number) {
  try {
    const user = await getAuthenticatedUser();

    if (!amount || amount <= 0) {
      return { success: false, error: "Please enter a valid payment amount." };
    }

    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, shopId: user.shopId },
    });
    if (!supplier) return { success: false, error: "Supplier not found." };

    await prisma.supplier.update({
      where: { id: supplierId },
      data: {
        currentDue: { decrement: amount }, // 👈 Decrements currentDue
      },
    });

    revalidatePath("/dashboard/admin/suppliers");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to record payment." };
  }
}

export async function deleteSupplierAction(id: string) {
  try {
    const user = await getAuthenticatedUser();

    const supplier = await prisma.supplier.findFirst({
      where: { id, shopId: user.shopId },
    });
    if (!supplier) return { success: false, error: "Supplier not found." };

    if (Number(supplier.currentDue) > 0) {
      return {
        success: false,
        error: `Cannot delete: You owe ${supplier.companyName} an unpaid balance of ${supplier.currentDue}.`,
      };
    }

    await prisma.supplier.delete({ where: { id } });

    revalidatePath("/dashboard/admin/suppliers");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete supplier." };
  }
}