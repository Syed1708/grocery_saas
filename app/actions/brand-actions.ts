"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.shopId) throw new Error("Unauthorized");
  if (session.user.role !== "OWNER" && session.user.role !== "MANAGER" && session.user.role !== "ADMIN") {
    throw new Error("Forbidden: Only Owners and Managers can manage brands.");
  }
  return session.user;
}

export async function createBrandAction(formData: FormData) {
  try {
    const user = await getAuthenticatedUser();
    const name = formData.get("name")?.toString().trim();
    const companyName = formData.get("companyName")?.toString().trim() || null;
    const contactPerson = formData.get("contactPerson")?.toString().trim() || null;
    const phone = formData.get("phone")?.toString().trim() || null;
    const status = formData.get("status")?.toString() || "active";

    if (!name) return { success: false, error: "Brand name is required." };

    await prisma.brand.create({
      data: {
        name,
        companyName,
        contactPerson,
        phone,
        status,
        shopId: user.shopId,
      },
    });

    revalidatePath("/dashboard/admin/products");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create brand." };
  }
}

// 👈 Added Update Brand Action
export async function updateBrandAction(formData: FormData) {
  try {
    const user = await getAuthenticatedUser();
    const id = formData.get("id")?.toString();
    const name = formData.get("name")?.toString().trim();
    const companyName = formData.get("companyName")?.toString().trim() || null;
    const contactPerson = formData.get("contactPerson")?.toString().trim() || null;
    const phone = formData.get("phone")?.toString().trim() || null;
    const status = formData.get("status")?.toString() || "active";

    if (!id || !name) return { success: false, error: "Missing required fields." };

    await prisma.brand.update({
      where: { id, shopId: user.shopId },
      data: {
        name,
        companyName,
        contactPerson,
        phone,
        status,
      },
    });

    revalidatePath("/dashboard/admin/products");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update brand." };
  }
}

export async function deleteBrandAction(id: string) {
  try {
    const user = await getAuthenticatedUser();

    const productCount = await prisma.product.count({
      where: { brandId: id, shopId: user.shopId },
    });

    if (productCount > 0) {
      return {
        success: false,
        error: `Cannot delete: Brand is in use by ${productCount} product(s). Remove products first.`,
      };
    }

    await prisma.brand.delete({ where: { id, shopId: user.shopId } });

    revalidatePath("/dashboard/admin/products");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete brand." };
  }
}