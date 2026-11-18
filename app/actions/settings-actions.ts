"use server";

import { requireAuth } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import {
  shopProfileSchema,
  receiptSettingsSchema,
  vatSettingsSchema,
} from "@/lib/validations/settings";
import { revalidatePath } from "next/cache";
import { getErrorMessage } from "@/lib/utils";

// ==========================================
// RBAC & MULTI-TENANCY GUARD
// ==========================================
const SETTINGS_REVALIDATE_PATHS = [
  "/dashboard/admin/settings",
  "/dashboard/admin/reports",
];

function revalidateSettings(extra: string[] = []) {
  for (const path of [...SETTINGS_REVALIDATE_PATHS, ...extra]) revalidatePath(path);
}

async function verifyShopAdmin() {
  const { shopId, userId, activeBranchId } = await requireAuth({
    allowedRoles: ["OWNER", "MANAGER"],
    requireActiveStatus: true,
  });

  // 👈 Return active branchId as well
  return { shopId, userId, branchId: activeBranchId };
}

// ==========================================
// 1. UPDATE GENERAL STORE & ACTIVE BRANCH PROFILE
// ==========================================
export async function updateShopProfileAction(rawInput: unknown) {
  try {
    const { shopId, activeBranchId: branchId, role } = await requireAuth({
      allowedRoles: ["OWNER", "MANAGER"],
      requireActiveStatus: true,
    });
    const isOwner = role === "OWNER";

    const parsed = shopProfileSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const data = parsed.data;

    await prisma.$transaction(async (tx) => {
      // 1. Both Owner & Branch Manager can update the active branch outlet
      if (branchId) {
        await tx.branch.update({
          where: { id: branchId, shopId },
          data: {
            name: data.branchName,
            phone: data.phone,
            address: data.address,
            email: data.email || null,
          },
        });
      }

      // 2. 🛑 STRICT RBAC: ONLY Owner can touch Central Head Office credentials!
      if (isOwner) {
        await tx.shop.update({
          where: { id: shopId },
          data: {
            name: data.shopName,
            nameEn: data.nameEn || null,
            tradeLicense: data.tradeLicense || null,
            binVatNumber: data.binVatNumber || null,
            currencySymbol: data.currencySymbol,
          },
        });
      }
    });

    revalidateSettings(["/dashboard/admin/branches"]);
    return { success: true };
  } catch (err) {
    console.error("updateShopProfileAction error:", err);
    return { success: false, error: getErrorMessage(err, "Failed to update profile.") };
  }
}

// ==========================================
// 2. UPDATE POS RECEIPT & THERMAL PRINTER
// ==========================================
export async function updateReceiptSettingsAction(rawInput: unknown) {
  try {
    const { shopId } = await verifyShopAdmin();
    const parsed = receiptSettingsSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const data = parsed.data;
    await prisma.shop.update({
      where: { id: shopId },
      data: {
        thermalWidth: data.thermalWidth,
        banglaReceipt: data.banglaReceipt,
        invoiceHeader: data.invoiceHeader || null,
        invoiceFooter: data.invoiceFooter || null,
      },
    });

    revalidateSettings(["/dashboard/admin/reports/closings"]);
    return { success: true };
  } catch (err) {
    console.error("updateReceiptSettingsAction error:", err);
    return { success: false, error: getErrorMessage(err, "Failed to update receipt settings.") };
  }
}

// ==========================================
// 3. UPDATE VAT & NBR TAX CONFIGURATION (Owner only)
// ==========================================
export async function updateVatSettingsAction(rawInput: unknown) {
  try {
    const { shopId } = await requireAuth({
      allowedRoles: ["OWNER"],
      requireActiveStatus: true,
    });

    const parsed = vatSettingsSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const data = parsed.data;
    await prisma.shop.update({
      where: { id: shopId },
      data: {
        enableVat: data.enableVat,
        vatPercent: data.vatPercent,
        binVatNumber: data.binVatNumber || null,
      },
    });

    revalidateSettings();
    return { success: true };
  } catch (err) {
    console.error("updateVatSettingsAction error:", err);
    return { success: false, error: getErrorMessage(err, "Failed to update VAT settings.") };
  }
}
