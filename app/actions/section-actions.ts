"use server";

import { requireAuth } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getAuthenticatedUser() {
  return requireAuth({
    allowedRoles: ["OWNER", "MANAGER"],
    requireActiveStatus: true,
  });
}

export async function createSectionAction(formData: FormData) {
  try {
    const user = await getAuthenticatedUser();
    const name = formData.get("name")?.toString().trim();
    const code = formData.get("code")?.toString().trim() || null;
    const description = formData.get("description")?.toString().trim() || null;
    const status = formData.get("status")?.toString() || "active";

    if (!name) return { success: false, error: "Section / Shelf name is required." };

    await prisma.productSection.create({
      data: {
        name,
        code,
        description,
        status,
        shopId: user.shopId,
      },
    });

    revalidatePath("/dashboard/admin/products");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create section." };
  }
}

// 👈 Added Update Section Action
export async function updateSectionAction(formData: FormData) {
  try {
    const user = await getAuthenticatedUser();
    const id = formData.get("id")?.toString();
    const name = formData.get("name")?.toString().trim();
    const code = formData.get("code")?.toString().trim() || null;
    const description = formData.get("description")?.toString().trim() || null;
    const status = formData.get("status")?.toString() || "active";

    if (!id || !name) return { success: false, error: "Missing required fields." };

    await prisma.productSection.update({
      where: { id, shopId: user.shopId },
      data: {
        name,
        code,
        description,
        status,
      },
    });

    revalidatePath("/dashboard/admin/products");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update section." };
  }
}

export async function deleteSectionAction(id: string) {
  try {
    const user = await getAuthenticatedUser();

    const productCount = await prisma.product.count({
      where: { sectionId: id, shopId: user.shopId },
    });

    if (productCount > 0) {
      return {
        success: false,
        error: `Cannot delete: Shelf is in use by ${productCount} product(s). Remove products first.`,
      };
    }

    await prisma.productSection.delete({ where: { id, shopId: user.shopId } });

    revalidatePath("/dashboard/admin/products");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete section." };
  }
}