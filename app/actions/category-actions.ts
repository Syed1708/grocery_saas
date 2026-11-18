"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { saveUploadedFile, deleteUploadedFile } from "@/lib/file-storage";
import { categorySchema } from "@/lib/validations";
import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types/rbac";
import { getErrorMessage } from "@/lib/utils";

const CATEGORY_REVALIDATE_PATHS = [
  "/dashboard/admin/categories",
  "/dashboard/admin/products",
  "/pos",
];

function revalidateCategoryPaths() {
  for (const path of CATEGORY_REVALIDATE_PATHS) revalidatePath(path);
}

/** Map a category form to the shape `categorySchema` expects. */
function formToCategoryInput(formData: FormData) {
  return {
    id: formData.get("id")?.toString(),
    name: formData.get("name")?.toString().trim(),
    description: formData.get("description")?.toString().trim() || null,
    status: formData.get("status")?.toString() || "active",
  };
}

export async function createCategoryAction(formData: FormData) {
  try {
    // 🛡️ Zero-Trust Guard: Enforce specific permission for Catalog Management
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });

    const parsed = categorySchema.safeParse(formToCategoryInput(formData));
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { name, description, status } = parsed.data;

    // Generate clean unique slug
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString().slice(-4)}`;

    // Prevent duplicate name within the same store
    const existing = await prisma.category.findFirst({
      where: { shopId: user.shopId, name },
    });
    if (existing) {
      return { success: false, error: "A category with this name already exists in your store." };
    }

    // Save uploaded image to public/uploads/categories
    const imageFile = formData.get("image") as File | null;
    let imageUrl: string | null = null;
    if (imageFile && imageFile.size > 0) {
      imageUrl = await saveUploadedFile(imageFile, "categories");
    }

    await prisma.category.create({
      data: {
        name,
        slug,
        description,
        image: imageUrl,
        status,
        shopId: user.shopId,
      },
    });

    revalidateCategoryPaths();
    return { success: true };
  } catch (error) {
    console.error("Create category error:", error);
    return { success: false, error: getErrorMessage(error, "Failed to create category.") };
  }
}

export async function updateCategoryAction(formData: FormData) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });

    const id = formData.get("id")?.toString();
    if (!id) return { success: false, error: "Missing category ID." };

    const parsed = categorySchema.safeParse(formToCategoryInput(formData));
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { name, description, status } = parsed.data;

    const currentCategory = await prisma.category.findFirst({
      where: { id, shopId: user.shopId },
    });
    if (!currentCategory) return { success: false, error: "Category not found." };

    // Handle image replacement & old file cleanup
    const imageFile = formData.get("image") as File | null;
    let imageUrl = currentCategory.image;

    if (imageFile && imageFile.size > 0) {
      if (currentCategory.image) {
        await deleteUploadedFile(currentCategory.image);
      }
      imageUrl = await saveUploadedFile(imageFile, "categories");
    }

    await prisma.category.update({
      where: { id },
      data: { name, description, image: imageUrl, status },
    });

    revalidateCategoryPaths();
    return { success: true };
  } catch (error) {
    console.error("Update category error:", error);
    return { success: false, error: getErrorMessage(error, "Failed to update category.") };
  }
}

export async function deleteCategoryAction(id: string) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });

    const category = await prisma.category.findFirst({
      where: { id, shopId: user.shopId },
      include: { _count: { select: { products: true } } },
    });
    if (!category) return { success: false, error: "Category not found." };

    if (category._count.products > 0) {
      return {
        success: false,
        error: `Cannot delete: This category contains ${category._count.products} products. Move them first.`,
      };
    }

    if (category.image) {
      await deleteUploadedFile(category.image);
    }

    await prisma.category.delete({ where: { id } });

    revalidateCategoryPaths();
    return { success: true };
  } catch (error) {
    console.error("Delete category error:", error);
    return { success: false, error: getErrorMessage(error, "Failed to delete category.") };
  }
}
