"use server";

import { requireAuth } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/types/rbac";
import { revalidatePath } from "next/cache";
import { getErrorMessage } from "@/lib/utils";

const BRAND_REVALIDATE_PATHS = ["/dashboard/admin/products", "/dashboard/pos"];

function revalidateBrands() {
  for (const path of BRAND_REVALIDATE_PATHS) revalidatePath(path);
}

export async function createBrandAction(formData: FormData) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });

    const name = formData.get("name")?.toString().trim();
    const companyName = formData.get("companyName")?.toString().trim() || null;
    const contactPerson =
      formData.get("contactPerson")?.toString().trim() || null;
    const phone = formData.get("phone")?.toString().trim() || null;
    const status = formData.get("status")?.toString() === "inactive" ? "inactive" : "active";

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

    revalidateBrands();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Failed to create brand."),
    };
  }
}

export async function updateBrandAction(formData: FormData) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });

    const id = formData.get("id")?.toString();
    const name = formData.get("name")?.toString().trim();
    const companyName = formData.get("companyName")?.toString().trim() || null;
    const contactPerson =
      formData.get("contactPerson")?.toString().trim() || null;
    const phone = formData.get("phone")?.toString().trim() || null;
    const status = formData.get("status")?.toString() === "inactive" ? "inactive" : "active";

    if (!id || !name) {
      return { success: false, error: "Missing required fields." };
    }

    const existing = await prisma.brand.findFirst({
      where: { id, shopId: user.shopId },
      select: { id: true },
    });
    if (!existing) return { success: false, error: "Brand not found." };

    await prisma.brand.update({
      where: { id },
      data: { name, companyName, contactPerson, phone, status },
    });

    revalidateBrands();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Failed to update brand."),
    };
  }
}

export async function deleteBrandAction(id: string) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });

    if (user.role !== "OWNER") {
      return {
        success: false,
        error: "অনুমতি নেই: শুধুমাত্র দোকানের মালিক ব্র্যান্ড মুছে ফেলতে পারেন।",
      };
    }

    const existing = await prisma.brand.findFirst({
      where: { id, shopId: user.shopId },
      select: { id: true },
    });
    if (!existing) return { success: false, error: "Brand not found." };

    const productCount = await prisma.product.count({
      where: { brandId: id, shopId: user.shopId },
    });

    if (productCount > 0) {
      return {
        success: false,
        error: `Cannot delete: Brand is in use by ${productCount} product(s). Remove products first.`,
      };
    }

    await prisma.brand.delete({ where: { id } });

    revalidateBrands();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Failed to delete brand."),
    };
  }
}
