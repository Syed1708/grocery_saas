"use server";

import { requireAuth } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/types/rbac";
import { revalidatePath } from "next/cache";

export async function createBrandAction(formData: FormData) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.POS_ACCESS,
      requireActiveStatus: true,
    });

    if (!user.activeBranchId) {
      return { success: false, error: "সক্রিয় ব্রাঞ্চ পাওয়া যায়নি।" };
    }
    const name = formData.get("name")?.toString().trim();
    const companyName = formData.get("companyName")?.toString().trim() || null;
    const contactPerson =
      formData.get("contactPerson")?.toString().trim() || null;
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
    return {
      success: false,
      error: error.message || "Failed to create brand.",
    };
  }
}

// 👈 Added Update Brand Action
export async function updateBrandAction(formData: FormData) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.POS_ACCESS,
      requireActiveStatus: true,
    });

    if (!user.activeBranchId) {
      return { success: false, error: "সক্রিয় ব্রাঞ্চ পাওয়া যায়নি।" };
    }
    const id = formData.get("id")?.toString();
    const name = formData.get("name")?.toString().trim();
    const companyName = formData.get("companyName")?.toString().trim() || null;
    const contactPerson =
      formData.get("contactPerson")?.toString().trim() || null;
    const phone = formData.get("phone")?.toString().trim() || null;
    const status = formData.get("status")?.toString() || "active";

    if (!id || !name)
      return { success: false, error: "Missing required fields." };

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
    return {
      success: false,
      error: error.message || "Failed to update brand.",
    };
  }
}

export async function deleteBrandAction(id: string) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.POS_ACCESS,
      requireActiveStatus: true,
    });

    if (!user.activeBranchId) {
      return { success: false, error: "সক্রিয় ব্রাঞ্চ পাওয়া যায়নি।" };
    }

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
    return {
      success: false,
      error: error.message || "Failed to delete brand.",
    };
  }
}
