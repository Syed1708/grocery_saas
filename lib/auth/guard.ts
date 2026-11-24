// lib/auth/guard.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { prisma } from "@/lib/prisma";
import { DEFAULT_ROLE_PERMISSIONS, PermissionKey, UserRole } from "@/types";

interface AuthGuardOptions {
  allowedRoles?: UserRole[];
  requiredPermission?: PermissionKey;
  requiredAnyPermission?: PermissionKey[];
  requireActiveStatus?: boolean;
}

export async function requireAuth(options: AuthGuardOptions = {}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.shopId) {
    throw new Error("UNAUTHORIZED: Please log in to perform this action.");
  }

  const { id: userId, shopId, branchId: activeBranchId } = session.user;

  // 1. Ensure a branch context exists
  if (!activeBranchId) {
    throw new Error("FORBIDDEN: No active branch associated with this session.");
  }

  // 2. Re-validate identity against the DB on every guarded call. The role in
  // the JWT can be stale after a promotion/demotion or deactivation, and the
  // tokenVersion invalidates sessions after a password/role/status change.
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isActive: true, customPermissions: true, tokenVersion: true },
  });

  if (!dbUser || !dbUser.isActive) {
    throw new Error("FORBIDDEN: User account is inactive or revoked.");
  }

  if (dbUser.tokenVersion !== (session.user.tokenVersion ?? 0)) {
    throw new Error("FORBIDDEN: Session has been revoked. Please sign in again.");
  }

  const role: UserRole = dbUser.role as UserRole;

  if (options.allowedRoles && !options.allowedRoles.includes(role)) {
    throw new Error(`FORBIDDEN: Requires one of [${options.allowedRoles.join(", ")}].`);
  }

  if (options.requiredPermission && role !== "OWNER") {
    const basePermissions = DEFAULT_ROLE_PERMISSIONS[role] || [];
    const storedPermissions = Array.isArray(dbUser.customPermissions)
      ? (dbUser.customPermissions as PermissionKey[])
      : null;

    // If explicit permissions are saved, use them. Otherwise use role defaults.
    const activePermissions =
      storedPermissions !== null ? storedPermissions : basePermissions;
    const hasPermission = activePermissions.includes(options.requiredPermission);

    if (!hasPermission) {
      throw new Error(`FORBIDDEN: Missing permission [${options.requiredPermission}].`);
    }
  }

  if (options.requiredAnyPermission?.length && role !== "OWNER") {
    const basePermissions = DEFAULT_ROLE_PERMISSIONS[role] || [];
    const storedPermissions = Array.isArray(dbUser.customPermissions)
      ? (dbUser.customPermissions as PermissionKey[])
      : null;
    const activePermissions =
      storedPermissions !== null ? storedPermissions : basePermissions;

    if (!options.requiredAnyPermission.some((permission) => activePermissions.includes(permission))) {
      throw new Error(
        `FORBIDDEN: Requires one of [${options.requiredAnyPermission.join(", ")}].`
      );
    }
  }

  return {
    userId,
    shopId,
    role,
    activeBranchId, // Guaranteed string, completely typed!
  };
}
