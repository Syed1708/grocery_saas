"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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

async function getAdminUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.shopId) throw new Error("Unauthorized");
  if (session.user.role !== "OWNER" && session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    throw new Error("Forbidden: Only store owners can manage branches.");
  }
  return session.user;
}

export async function createBranchAction(formData: FormData) {
  try {
    const user = await getAdminUser();

    const validated = branchSchema.safeParse({
      name: formData.get("name")?.toString().trim(),
      code: formData.get("code")?.toString().trim(),
      phone: formData.get("phone")?.toString().trim() || null,
      email: formData.get("email")?.toString().trim() || null,
      address: formData.get("address")?.toString().trim() || null,
      isMain: formData.get("isMain") === "true",
      status: formData.get("status")?.toString() || "active",
    });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const data = validated.data;

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

      await tx.branch.create({
        data: {
          ...data,
          email: data.email || null,
          shopId: user.shopId,
        },
      });
    });

    revalidatePath("/dashboard/admin/branches");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create branch." };
  }
}

export async function updateBranchAction(formData: FormData) {
  try {
    const user = await getAdminUser();
    const id = formData.get("id")?.toString();
    if (!id) return { success: false, error: "Missing branch ID." };

    const validated = branchSchema.safeParse({
      id,
      name: formData.get("name")?.toString().trim(),
      code: formData.get("code")?.toString().trim(),
      phone: formData.get("phone")?.toString().trim() || null,
      email: formData.get("email")?.toString().trim() || null,
      address: formData.get("address")?.toString().trim() || null,
      isMain: formData.get("isMain") === "true",
      status: formData.get("status")?.toString() || "active",
    });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const data = validated.data;

    await prisma.$transaction(async (tx) => {
      if (data.isMain) {
        await tx.branch.updateMany({
          where: { shopId: user.shopId, isMain: true, id: { not: id } },
          data: { isMain: false },
        });
      }

      await tx.branch.update({
        where: { id },
        data: {
          ...data,
          email: data.email || null,
        },
      });
    });

    revalidatePath("/dashboard/admin/branches");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update branch." };
  }
}

export async function deleteBranchAction(id: string) {
  try {
    const user = await getAdminUser();

    const branch = await prisma.branch.findFirst({
      where: { id, shopId: user.shopId },
      include: {
        _count: {
          select: { users: true, productStocks: true, sales: true },
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

    if (branch._count.sales > 0) {
      return { success: false, error: "Cannot delete: This branch has sales records. Set status to inactive instead." };
    }

    await prisma.branch.delete({ where: { id } });

    revalidatePath("/dashboard/admin/branches");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete branch." };
  }
}