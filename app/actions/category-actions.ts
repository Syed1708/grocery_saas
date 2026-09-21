"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { dbConnect } from "@/services/dbConnect";
import { Category } from "@/models/Category";
import { revalidatePath } from "next/cache";

// Helper to verify user permissions
async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.shopId) {
    throw new Error("Unauthorized: Please log in.");
  }

  if (session.user.role !== "OWNER" && session.user.role !== "MANAGER") {
    throw new Error("Forbidden: Only Owners and Managers can modify categories.");
  }

  return session.user;
}

export async function createCategoryAction(formData: FormData) {
  const user = await getAuthenticatedUser();
  await dbConnect();

  const name = formData.get("name")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || "";
  const image = formData.get("image")?.toString().trim() || "";

  if (!name) {
    return { success: false, error: "Category name is required." };
  }

  try {
    const existing = await Category.findOne({ shopId: user.shopId, name });
    if (existing) {
      return { success: false, error: "A category with this name already exists." };
    }

    await Category.create({
      name,
      description,
      image,
      shopId: user.shopId,
    });

    revalidatePath("/dashboard/admin/categories");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create category." };
  }
}

export async function updateCategoryAction(formData: FormData) {
  const user = await getAuthenticatedUser();
  await dbConnect();

  const id = formData.get("id")?.toString();
  const name = formData.get("name")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || "";
  const image = formData.get("image")?.toString().trim() || "";

  if (!id || !name) {
    return { success: false, error: "Missing required fields." };
  }

  try {
    const category = await Category.findOneAndUpdate(
      { _id: id, shopId: user.shopId },
      { name, description, image },
      { new: true }
    );

    if (!category) {
      return { success: false, error: "Category not found." };
    }

    revalidatePath("/dashboard/admin/categories");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update category." };
  }
}

export async function deleteCategoryAction(id: string) {
  const user = await getAuthenticatedUser();
  await dbConnect();

  try {
    const deleted = await Category.findOneAndDelete({ _id: id, shopId: user.shopId });

    if (!deleted) {
      return { success: false, error: "Category not found or unauthorized." };
    }

    revalidatePath("/dashboard/admin/categories");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete category." };
  }
}