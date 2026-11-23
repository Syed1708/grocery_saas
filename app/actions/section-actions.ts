"use server";

import { requireAuth } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/types";
import { revalidatePath } from "next/cache";
import { getErrorMessage } from "@/lib/utils";

async function requireCatalogManager() {
  return requireAuth({
    requiredPermission: PERMISSIONS.CATALOG_MANAGE,
    requireActiveStatus: true,
  });
}

export async function createSectionAction(formData: FormData) {
  try {
    const user = await requireCatalogManager();
    const name = formData.get("name")?.toString().trim();
    const code = formData.get("code")?.toString().trim() || null;
    const description = formData.get("description")?.toString().trim() || null;
    const status = formData.get("status")?.toString() === "inactive" ? "inactive" : "active";

    if (!name) return { success: false, error: "Section / Shelf name is required." };

    await prisma.productSection.create({
      data: { name, code, description, status, shopId: user.shopId },
    });

    revalidatePath("/dashboard/admin/products");
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Failed to create section.") };
  }
}

export async function updateSectionAction(formData: FormData) {
  try {
    const user = await requireCatalogManager();
    const id = formData.get("id")?.toString();
    const name = formData.get("name")?.toString().trim();
    const code = formData.get("code")?.toString().trim() || null;
    const description = formData.get("description")?.toString().trim() || null;
    const status = formData.get("status")?.toString() === "inactive" ? "inactive" : "active";

    if (!id || !name) return { success: false, error: "Missing required fields." };

    const existing = await prisma.productSection.findFirst({
      where: { id, shopId: user.shopId },
      select: { id: true },
    });
    if (!existing) return { success: false, error: "Section not found." };

    await prisma.productSection.update({
      where: { id },
      data: { name, code, description, status },
    });

    revalidatePath("/dashboard/admin/products");
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Failed to update section.") };
  }
}

export async function deleteSectionAction(id: string) {
  try {
    const user = await requireCatalogManager();

    const existing = await prisma.productSection.findFirst({
      where: { id, shopId: user.shopId },
      select: { id: true },
    });
    if (!existing) return { success: false, error: "Section not found." };

    const productCount = await prisma.product.count({
      where: { sectionId: id, shopId: user.shopId },
    });

    if (productCount > 0) {
      return {
        success: false,
        error: `Cannot delete: Shelf is in use by ${productCount} product(s). Remove products first.`,
      };
    }

    await prisma.productSection.delete({ where: { id } });

    revalidatePath("/dashboard/admin/products");
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Failed to delete section.") };
  }
}
