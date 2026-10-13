"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function switchBranchAction(branchId: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    // Cashiers cannot switch branches
    if (session.user.role === "CASHIER") {
      throw new Error("Cashiers are restricted to their assigned branch.");
    }

    // Verify branch belongs to user's shop
    const branch = await prisma.branch.findFirst({
      where: { id: branchId, shopId: session.user.shopId, status: "active" },
    });

    if (!branch) {
      throw new Error("Branch not found or inactive.");
    }

    // Update active branch for user in MySQL
    await prisma.user.update({
      where: { id: session.user.id },
      data: { branchId: branch.id },
    });

    revalidatePath("/", "layout");
    return { success: true, branchName: branch.name };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to switch branch." };
  }
}