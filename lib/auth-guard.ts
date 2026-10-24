import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/types";

/**
 * Reusable Auth Guard for Server Actions
 * Checks if user is logged in, verifies role permissions, and returns tenant info & active branch.
 */
export async function requireAuth(
  allowedRoles: UserRole[] = ["OWNER", "MANAGER", "ADMIN", "SUPER_ADMIN"]
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.shopId) {
    throw new Error("Unauthorized: Please log in to perform this action.");
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(session.user.role)) {
    throw new Error("Forbidden: You do not have permission to perform this action.");
  }

  // Resolve active branch with fallback to Main Branch
  let activeBranchId = session.user.branchId;
  if (!activeBranchId) {
    const mainBranch = await prisma.branch.findFirst({
      where: { shopId: session.user.shopId, isMain: true },
      select: { id: true },
    });
    activeBranchId = mainBranch?.id || null;
  }

  return {
    userId: session.user.id,
    shopId: session.user.shopId,
    role: session.user.role,
    activeBranchId,
  };
}