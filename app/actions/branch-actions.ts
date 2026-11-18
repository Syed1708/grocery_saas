"use server";

import { requireAuth } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function switchBranchAction(branchId: string) {
  try {
    // 🛑 Only OWNER can switch outlets; non-owners throw (caught below).
    const { shopId, userId } = await requireAuth({
      allowedRoles: ["OWNER"],
      requireActiveStatus: true,
    });

    // Verify branch belongs to user's shop and is active
    const branch = await prisma.branch.findFirst({
      where: { 
        id: branchId, 
        shopId, 
        status: "active" 
      },
    });

    if (!branch) {
      return { success: false, error: "Branch not found or inactive." };
    }

    // 1. Update user's active branch in MySQL
    await prisma.user.update({
      where: { id: userId },
      data: { branchId: branch.id },
    });

    // 2. Set an active branch cookie as fail-safe
    const cookieStore = await cookies();
    cookieStore.set("active_branch_id", branch.id, { path: "/", httpOnly: false });

    // 3. Clear cache across all server routes
    revalidatePath("/", "layout");

    return { 
      success: true, 
      branchId: branch.id,
      branchName: branch.name,
      branchCode: branch.code 
    };
  } catch (error: any) {
    console.error("switchBranchAction error:", error);
    return { success: false, error: error.message || "Failed to switch branch." };
  }
}