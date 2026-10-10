"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { saveUploadedFile, deleteUploadedFile } from "@/lib/file-storage";

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.shopId) {
    throw new Error("Unauthorized: Please log in.");
  }
  if (session.user.role !== "OWNER" && session.user.role !== "MANAGER") {
    throw new Error("Forbidden: Only Owners and Managers can manage categories.");
  }
  return session.user;
}

export async function createCategoryAction(formData: FormData) {
  try {
    const user = await getAuthenticatedUser();

    const name = formData.get("name")?.toString().trim();
    const description = formData.get("description")?.toString().trim() || "";
    const imageFile = formData.get("image") as File | null;

    if (!name) return { success: false, error: "Category name is required." };

    const existing = await prisma.category.findUnique({
      where: { shopId_name: { shopId: user.shopId, name } },
    });
    if (existing) {
      return { success: false, error: "A category with this name already exists in your store." };
    }

    // Save image to public/uploads/categories
    let imageUrl = "";
    if (imageFile && imageFile.size > 0) {
      imageUrl = await saveUploadedFile(imageFile, "categories");
    }

    await prisma.category.create({
      data: {
        name,
        description,
        image: imageUrl || null,
        shopId: user.shopId,
      },
    });

    revalidatePath("/dashboard/admin/categories");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create category." };
  }
}

export async function updateCategoryAction(formData: FormData) {
  try {
    const user = await getAuthenticatedUser();

    const id = formData.get("id")?.toString();
    const name = formData.get("name")?.toString().trim();
    const description = formData.get("description")?.toString().trim() || "";
    const imageFile = formData.get("image") as File | null;

    if (!id || !name) return { success: false, error: "Missing required fields." };

    const currentCategory = await prisma.category.findFirst({
      where: { id, shopId: user.shopId },
    });
    if (!currentCategory) return { success: false, error: "Category not found." };

    let imageUrl = currentCategory.image;

    // If new image uploaded, delete old image from disk and save new
    if (imageFile && imageFile.size > 0) {
      if (currentCategory.image) {
        await deleteUploadedFile(currentCategory.image);
      }
      imageUrl = await saveUploadedFile(imageFile, "categories");
    }

    await prisma.category.update({
      where: { id },
      data: {
        name,
        description,
        image: imageUrl,
      },
    });

    revalidatePath("/dashboard/admin/categories");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update category." };
  }
}

export async function deleteCategoryAction(id: string) {
  try {
    const user = await getAuthenticatedUser();

    const category = await prisma.category.findFirst({
      where: { id, shopId: user.shopId },
    });
    if (!category) return { success: false, error: "Category not found." };

    // Delete associated image file from disk
    if (category.image) {
      await deleteUploadedFile(category.image);
    }

    await prisma.category.delete({
      where: { id },
    });

    revalidatePath("/dashboard/admin/categories");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete category." };
  }
}