// lib/auth/guard.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { prisma } from "@/lib/prisma";
import { DEFAULT_ROLE_PERMISSIONS, PermissionKey, UserRole } from "@/types";

interface AuthGuardOptions {
  allowedRoles?: UserRole[];
  requiredPermission?: PermissionKey;
  requireActiveStatus?: boolean;
}

export async function requireAuth(options: AuthGuardOptions = {}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.shopId) {
    throw new Error("UNAUTHORIZED: Please log in to perform this action.");
  }

  const { id: userId, shopId, role, branchId: activeBranchId } = session.user;

  // 1. Ensure a branch context exists
  if (!activeBranchId) {
    throw new Error(
      "FORBIDDEN: No active branch associated with this session.",
    );
  }

  // 2. Coarse Role Check
  if (options.allowedRoles && !options.allowedRoles.includes(role)) {
    throw new Error(
      `FORBIDDEN: Requires one of [${options.allowedRoles.join(", ")}].`,
    );
  }

  // 3. Fast DB verification for sensitive mutations / custom permissions
  if (options.requireActiveStatus || options.requiredPermission) {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true, customPermissions: true },
    });

    if (!dbUser || !dbUser.isActive) {
      throw new Error("FORBIDDEN: User account is inactive or revoked.");
    }

    if (options.requiredPermission && role !== "OWNER") {
      const basePermissions = DEFAULT_ROLE_PERMISSIONS[role] || [];
      const storedPermissions = Array.isArray(dbUser.customPermissions)
        ? (dbUser.customPermissions as PermissionKey[])
        : null;

      // If explicit permissions are saved, use them. Otherwise use role defaults.
      const activePermissions =
        storedPermissions !== null ? storedPermissions : basePermissions;
      const hasPermission = activePermissions.includes(
        options.requiredPermission,
      );

      if (!hasPermission) {
        throw new Error(
          `FORBIDDEN: Missing permission [${options.requiredPermission}].`,
        );
      }
    }
  }

  return {
    userId,
    shopId,
    role,
    activeBranchId, // Guaranteed string, completely typed!
  };
}
