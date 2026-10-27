"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { prisma } from "@/lib/prisma";
import { 
  shopProfileSchema, 
  receiptSettingsSchema, 
  vatSettingsSchema, 
  branchSchema 
} from "@/lib/validations/settings";
import { revalidatePath } from "next/cache";

// ==========================================
// RBAC & MULTI-TENANCY GUARD
// ==========================================
async function verifyShopAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.shopId) {
    throw new Error("Unauthorized access: Session required.");
  }
  const role = session.user.role;
  if (role !== "OWNER" && role !== "MANAGER" && role !== "ADMIN" && role !== "SUPER_ADMIN") {
    throw new Error("Permission denied. Only Owner or Manager can modify store settings.");
  }

  // 👈 Return active branchId as well
  return { 
    shopId: session.user.shopId, 
    userId: session.user.id,
    branchId: session.user.branchId || null
  };
}

// ==========================================
// 1. UPDATE GENERAL STORE & ACTIVE BRANCH PROFILE
// ==========================================

export async function updateShopProfileAction(rawInput: unknown) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.shopId) {
      return { success: false, error: "Unauthorized" };
    }

    const { shopId, branchId, role } = session.user;
    const isOwner = role === "OWNER" || role === "ADMIN" || role === "SUPER_ADMIN";
    const isManager = role === "MANAGER";

    if (!isOwner && !isManager) {
      return { success: false, error: "Permission denied." };
    }

    const parsed = shopProfileSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { 
        success: false, 
        error: "Validation failed", 
        fieldErrors: parsed.error.flatten().fieldErrors 
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

    revalidatePath("/admin/settings");
    revalidatePath("/reports");
    return { success: true };
  } catch (err: any) {
    console.error("updateShopProfileAction error:", err);
    return { success: false, error: err.message || "Failed to update profile." };
  }
}

// ==========================================
// 2. UPDATE POS RECEIPT & THERMAL PRINTER (100% OK)
// ==========================================
export async function updateReceiptSettingsAction(rawInput: unknown) {
  try {
    const { shopId } = await verifyShopAdmin();
    const parsed = receiptSettingsSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { 
        success: false, 
        error: "Validation failed", 
        fieldErrors: parsed.error.flatten().fieldErrors 
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

    revalidatePath("/admin/settings");
    revalidatePath("/reports/closings");
    return { success: true };
  } catch (err: any) {
    console.error("updateReceiptSettingsAction error:", err);
    return { success: false, error: err.message || "Failed to update receipt settings." };
  }
}

// ==========================================
// 3. UPDATE VAT & NBR TAX CONFIGURATION (100% OK)
// ==========================================
export async function updateVatSettingsAction(rawInput: unknown) {
  try {
    const { shopId } = await verifyShopAdmin();
    const parsed = vatSettingsSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { 
        success: false, 
        error: "Validation failed", 
        fieldErrors: parsed.error.flatten().fieldErrors 
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

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (err: any) {
    console.error("updateVatSettingsAction error:", err);
    return { success: false, error: err.message || "Failed to update VAT settings." };
  }
}

// ==========================================
// 4. UPSERT BRANCH (ATOMIC isMain + AUTO CASH DRAWER)
// ==========================================
export async function upsertBranchAction(rawInput: unknown) {
  try {
    const { shopId } = await verifyShopAdmin();
    const parsed = branchSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { 
        success: false, 
        error: "Validation failed", 
        fieldErrors: parsed.error.flatten().fieldErrors 
      };
    }

    const data = parsed.data;
    const code = data.code.trim().toUpperCase();

    // Prevent duplicate branch codes in the same shop
    const existing = await prisma.branch.findFirst({
      where: {
        shopId,
        code,
        ...(data.id ? { NOT: { id: data.id } } : {}),
      },
    });

    if (existing) {
      return { success: false, error: `Branch code '${code}' is already used by another outlet.` };
    }

    // Atomic transaction: Main branch swap + Branch save + Auto Cash Drawer
    await prisma.$transaction(async (tx) => {
      if (data.isMain) {
        await tx.branch.updateMany({
          where: { shopId, isMain: true },
          data: { isMain: false },
        });
      }

      if (data.id) {
        // Edit existing branch
        await tx.branch.update({
          where: { id: data.id, shopId },
          data: {
            name: data.name,
            code,
            phone: data.phone || null,
            email: data.email || null,
            address: data.address || null,
            isMain: data.isMain,
            status: data.status,
          },
        });
      } else {
        // 1. Create new branch
        const newBranch = await tx.branch.create({
          data: {
            name: data.name,
            code,
            phone: data.phone || null,
            email: data.email || null,
            address: data.address || null,
            isMain: data.isMain,
            status: data.status,
            shopId,
          },
        });

        // 2. 👈 AUTO-CREATE Cash Drawer for the new branch (Option 1 Requirement)
        await tx.account.create({
          data: {
            name: `ক্যাশ ড্রয়ার (${data.name})`,
            type: "CASH",
            openingBalance: 0,
            currentBalance: 0,
            status: "active",
            branchId: newBranch.id,
            shopId,
          },
        });
      }
    });

    revalidatePath("/admin/settings");
    revalidatePath("/admin/accounts");
    return { success: true };
  } catch (err: any) {
    console.error("upsertBranchAction error:", err);
    return { success: false, error: err.message || "Failed to save branch." };
  }
}

// ==========================================
// 5. SAFE DELETE BRANCH (Comprehensive Audit Guard)
// ==========================================
export async function deleteBranchAction(branchId: string) {
  try {
    const { shopId } = await verifyShopAdmin();

    const branch = await prisma.branch.findUnique({
      where: { id: branchId, shopId },
      include: {
        _count: {
          select: { 
            sales: true, 
            purchases: true, 
            expenses: true, 
            users: true 
          },
        },
      },
    });

    if (!branch) {
      return { success: false, error: "Branch not found." };
    }

    if (branch.isMain) {
      return { success: false, error: "Cannot delete the principal main branch." };
    }

    // Comprehensive Financial Guard
    const hasFinancialRecords =
      branch._count.sales > 0 ||
      branch._count.purchases > 0 ||
      branch._count.expenses > 0;

    if (hasFinancialRecords) {
      return {
        success: false,
        error: `Cannot delete branch with active transaction history (${branch._count.sales} sales, ${branch._count.purchases} purchases, ${branch._count.expenses} expenses). Deactivate it instead.`,
      };
    }

    await prisma.branch.delete({
      where: { id: branchId },
    });

    revalidatePath("/admin/settings");
    revalidatePath("/admin/accounts");
    return { success: true };
  } catch (err: any) {
    console.error("deleteBranchAction error:", err);
    return { success: false, error: err.message || "Failed to delete branch." };
  }
}