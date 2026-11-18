"use server";

import { requireAuth } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getErrorMessage } from "@/lib/utils";

export async function switchBranchAction(branchId: string) {
  try {
    // 🛑 Only OWNER can switch outlets; non-owners throw (caught below).
    const { shopId, userId } = await requireAuth({
      allowedRoles: ["OWNER"],
      requireActiveStatus: true,
    });

    // Verify branch belongs to user's shop and is active
    const branch = await prisma.branch.findFirst({
      where: { id: branchId, shopId, status: "active" },
    });

    if (!branch) {
      return { success: false, error: "Branch not found or inactive." };
    }

    // Persist the active branch for this user in MySQL
    await prisma.user.update({
      where: { id: userId },
      data: { branchId: branch.id },
    });

    // Clear cache across all server routes
    revalidatePath("/", "layout");

    return {
      success: true,
      branchId: branch.id,
      branchName: branch.name,
      branchCode: branch.code,
    };
  } catch (error) {
    console.error("switchBranchAction error:", error);
    return { success: false, error: getErrorMessage(error, "Failed to switch branch.") };
  }
}
