"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { saveUploadedFile, deleteUploadedFile } from "@/lib/file-storage";
import { categorySchema } from "@/lib/validations";
import { requireAuth } from "@/lib/auth-guard";



export async function createCategoryAction(formData: FormData) {
  try {
    const user = await requireAuth(["OWNER", "MANAGER", "ADMIN"]);

    // 1. Zod Validation (Includes status)
    const validated = categorySchema.safeParse({
      name: formData.get("name")?.toString().trim(),
      description: formData.get("description")?.toString().trim() || null,
      status: formData.get("status")?.toString() || "active",
    });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { name, description, status } = validated.data;

    // Generate clean unique slug
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString().slice(-4)}`;

    // 2. Prevent Duplicate Name within the same store
    const existing = await prisma.category.findFirst({
      where: { shopId: user.shopId, name },
    });
    if (existing) {
      return { success: false, error: "A category with this name already exists in your store." };
    }

    // 3. Save Uploaded Image to public/uploads/categories
    const imageFile = formData.get("image") as File | null;
    let imageUrl: string | null = null;
    if (imageFile && imageFile.size > 0) {
      imageUrl = await saveUploadedFile(imageFile, "categories");
    }

    // 4. Save to MySQL
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

    revalidatePath("/dashboard/admin/categories");
    revalidatePath("/dashboard/admin/products");
    return { success: true };
  } catch (error: any) {
    console.error("Create category error:", error);
    return { success: false, error: error.message || "Failed to create category." };
  }
}

export async function updateCategoryAction(formData: FormData) {
  try {
       const user = await requireAuth(["OWNER", "MANAGER", "ADMIN"]);

    const id = formData.get("id")?.toString();
    if (!id) return { success: false, error: "Missing category ID." };

    // 1. Zod Validation
    const validated = categorySchema.safeParse({
      id,
      name: formData.get("name")?.toString().trim(),
      description: formData.get("description")?.toString().trim() || null,
      status: formData.get("status")?.toString() || "active",
    });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { name, description, status } = validated.data;

    const currentCategory = await prisma.category.findFirst({
      where: { id, shopId: user.shopId },
    });
    if (!currentCategory) return { success: false, error: "Category not found." };

    // 2. Handle Image Replacement & Old File Cleanup
    const imageFile = formData.get("image") as File | null;
    let imageUrl = currentCategory.image;

    if (imageFile && imageFile.size > 0) {
      if (currentCategory.image) {
        await deleteUploadedFile(currentCategory.image);
      }
      imageUrl = await saveUploadedFile(imageFile, "categories");
    }

    // 3. Update in MySQL
    await prisma.category.update({
      where: { id },
      data: {
        name,
        description,
        image: imageUrl,
        status,
      },
    });

    revalidatePath("/dashboard/admin/categories");
    revalidatePath("/dashboard/admin/products");
    return { success: true };
  } catch (error: any) {
    console.error("Update category error:", error);
    return { success: false, error: error.message || "Failed to update category." };
  }
}

export async function deleteCategoryAction(id: string) {
  try {
        const user = await requireAuth(["OWNER", "MANAGER", "ADMIN"]);

    // Verify category belongs to user's shop
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

    // Delete image from disk
    if (category.image) {
      await deleteUploadedFile(category.image);
    }

    await prisma.category.delete({
      where: { id },
    });

    revalidatePath("/dashboard/admin/categories");
    revalidatePath("/dashboard/admin/products");
    return { success: true };
  } catch (error: any) {
    console.error("Delete category error:", error);
    return { success: false, error: error.message || "Failed to delete category." };
  }
}