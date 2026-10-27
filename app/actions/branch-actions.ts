"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function switchBranchAction(branchId: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.shopId) {
      return { success: false, error: "Unauthorized access." };
    }

    const role = session.user.role;
    const canSwitch = role === "OWNER" || role === "ADMIN" || role === "SUPER_ADMIN";

    // 🛑 BLOCK: Managers and Cashiers are locked to their assigned branch
    if (!canSwitch) {
      return { 
        success: false, 
        error: "Permission denied: Branch Managers and Cashiers cannot switch outlets." 
      };
    }

    // Verify branch belongs to user's shop and is active
    const branch = await prisma.branch.findFirst({
      where: { 
        id: branchId, 
        shopId: session.user.shopId, 
        status: "active" 
      },
    });

    if (!branch) {
      return { success: false, error: "Branch not found or inactive." };
    }

    // 1. Update user's active branch in MySQL
    await prisma.user.update({
      where: { id: session.user.id },
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