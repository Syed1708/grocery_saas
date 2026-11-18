"use server";

import { requireAuth } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PERMISSIONS } from "@/types";
import { getErrorMessage } from "@/lib/utils";

const branchSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Branch name is required").max(100),
  code: z.string().min(2, "Branch code is required").max(20).toUpperCase(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  address: z.string().max(300).optional().nullable(),
  isMain: z.boolean().default(false),
  status: z.enum(["active", "inactive"]).default("active"),
});

const BRANCH_REVALIDATE_PATHS = ["/dashboard/admin/branches"];

function revalidateBranchPaths() {
  for (const path of BRANCH_REVALIDATE_PATHS) revalidatePath(path);
  revalidatePath("/", "layout");
}

/** Map a branch form to the shape `branchSchema` expects. */
function formToBranchInput(formData: FormData) {
  return {
    id: formData.get("id")?.toString(),
    name: formData.get("name")?.toString().trim(),
    code: formData.get("code")?.toString().trim(),
    phone: formData.get("phone")?.toString().trim() || null,
    email: formData.get("email")?.toString().trim() || null,
    address: formData.get("address")?.toString().trim() || null,
    isMain: formData.get("isMain") === "true",
    status: formData.get("status")?.toString() || "active",
  };
}

interface BranchFieldsInput {
  name: string;
  code: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  isMain: boolean;
  status: "active" | "inactive";
}

/** Columns shared by create + update. */
function branchFields(data: BranchFieldsInput) {
  return {
    name: data.name,
    code: data.code,
    phone: data.phone,
    email: data.email || null,
    address: data.address,
    isMain: data.isMain,
    status: data.status,
  };
}

async function getAdminUser() {
  return requireAuth({
    requiredPermission: PERMISSIONS.BRANCH_MANAGE,
    requireActiveStatus: true,
  });
}

export async function createBranchAction(formData: FormData) {
  try {
    const user = await getAdminUser();

    const parsed = branchSchema.safeParse(formToBranchInput(formData));
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const data = parsed.data;

    // Check unique branch code within store
    const existing = await prisma.branch.findUnique({
      where: { shopId_code: { shopId: user.shopId, code: data.code } },
    });
    if (existing) {
      return { success: false, error: `Branch code "${data.code}" already exists.` };
    }

    await prisma.$transaction(async (tx) => {
      // If marked as main branch, demote previous main branch
      if (data.isMain) {
        await tx.branch.updateMany({
          where: { shopId: user.shopId, isMain: true },
          data: { isMain: false },
        });
      }

      const newBranch = await tx.branch.create({
        data: { ...branchFields(data), shopId: user.shopId },
      });

      // Auto-create the branch cash drawer
      await tx.account.create({
        data: {
          name: `ক্যাশ ড্রয়ার (${data.name})`,
          type: "CASH",
          openingBalance: 0,
          currentBalance: 0,
          status: "active",
          branchId: newBranch.id,
          shopId: user.shopId,
        },
      });
    });

    revalidateBranchPaths();
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Failed to create branch.") };
  }
}

export async function updateBranchAction(formData: FormData) {
  try {
    const user = await getAdminUser();
    const id = formData.get("id")?.toString();
    if (!id) return { success: false, error: "Missing branch ID." };

    const parsed = branchSchema.safeParse(formToBranchInput(formData));
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    // 🛡️ Verify the branch belongs to this shop before mutating
    const existing = await prisma.branch.findFirst({
      where: { id, shopId: user.shopId },
      select: { id: true },
    });
    if (!existing) return { success: false, error: "Branch not found." };

    const data = parsed.data;

    await prisma.$transaction(async (tx) => {
      if (data.isMain) {
        await tx.branch.updateMany({
          where: { shopId: user.shopId, isMain: true, id: { not: id } },
          data: { isMain: false },
        });
      }

      await tx.branch.update({
        where: { id },
        data: branchFields(data),
      });
    });

    revalidateBranchPaths();
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Failed to update branch.") };
  }
}

export async function deleteBranchAction(id: string) {
  try {
    const user = await getAdminUser();

    const branch = await prisma.branch.findFirst({
      where: { id, shopId: user.shopId },
      include: {
        _count: {
          select: { users: true, productStocks: true, sales: true, purchases: true, expenses: true },
        },
      },
    });

    if (!branch) return { success: false, error: "Branch not found." };

    if (branch.isMain) {
      return { success: false, error: "Cannot delete the Main Branch." };
    }

    if (branch._count.users > 0) {
      return { success: false, error: "Cannot delete: Staff are assigned to this branch. Reassign them first." };
    }

    const hasFinancialRecords =
      branch._count.sales > 0 ||
      branch._count.purchases > 0 ||
      branch._count.expenses > 0;

    if (hasFinancialRecords) {
      return {
        success: false,
        error: `Cannot delete: This branch has transaction history (${branch._count.sales} sales, ${branch._count.purchases} purchases, ${branch._count.expenses} expenses). Set status to inactive instead.`,
      };
    }

    await prisma.branch.delete({ where: { id } });

    revalidateBranchPaths();
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Failed to delete branch.") };
  }
}
