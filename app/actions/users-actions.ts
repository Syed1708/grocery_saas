// actions/users.ts
"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/guard";
import { revalidatePath } from "next/cache";
import { userSchema } from "@/lib/validations/user";
import { ZodError } from "zod";
import { DEFAULT_ROLE_PERMISSIONS, PERMISSIONS, UserRole } from "@/types/rbac";
import { getErrorMessage } from "@/lib/utils";

const USERS_REVALIDATE_PATH = "/dashboard/admin/users";
const VALID_PERMISSIONS = new Set<string>(Object.values(PERMISSIONS));

/** Normalize the various ways a form can reach a server action. */
function toRawData(input: unknown): Record<string, unknown> {
  if (input instanceof FormData) {
    return Object.fromEntries(input.entries());
  }
  if (input && typeof input === "object" && !Array.isArray(input)) {
    return input as Record<string, unknown>;
  }
  return {};
}

/** Keep only permission keys that exist in the RBAC catalog. */
function sanitizePermissions(permissions: string[]): string[] {
  return permissions.filter((permission) => VALID_PERMISSIONS.has(permission));
}

export async function getMyPermissionsAction() {
  try {
    const { userId } = await requireAuth();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, customPermissions: true, isActive: true },
    });

    if (!user || !user.isActive) return { success: false, permissions: [] };

    const base = DEFAULT_ROLE_PERMISSIONS[user.role as UserRole] || [];
    const custom = Array.isArray(user.customPermissions)
      ? (user.customPermissions as string[])
      : null;

    return {
      success: true,
      permissions: custom !== null ? custom : base,
    };
  } catch {
    return { success: false, permissions: [] };
  }
}

export async function saveUserAction(input: unknown) {
  try {
    const { shopId } = await requireAuth({
      allowedRoles: ["OWNER"],
      requireActiveStatus: true,
    });

    const parsed = userSchema.parse(toRawData(input));

    const duplicate = await prisma.user.findFirst({
      where: {
        email: parsed.email.toLowerCase().trim(),
        id: parsed.id ? { not: parsed.id } : undefined,
      },
    });

    if (duplicate) {
      throw new Error("A user with this email already exists.");
    }

    let passwordHash: string | undefined;
    if (parsed.password && parsed.password.trim().length > 0) {
      if (parsed.password.length < 6) {
        throw new Error("Password must be at least 6 characters.");
      }
      passwordHash = await bcrypt.hash(parsed.password, 10);
    } else if (!parsed.id) {
      throw new Error("Password is required for new users.");
    }

    // Only hash & update PIN if a new 4-digit PIN is provided
    let pinHash: string | undefined = undefined;
    if (parsed.supervisorPin && parsed.supervisorPin.trim().length === 4) {
      pinHash = await bcrypt.hash(parsed.supervisorPin, 10);
    }

    const finalBranchId = parsed.role === "OWNER" ? null : parsed.branchId;

    // Owners always have full access; custom permission overrides are for staff only.
    const customPermissions =
      parsed.role === "OWNER" ? [] : sanitizePermissions(parsed.customPermissions);

    if (parsed.id) {
      const currentUser = await prisma.user.findUnique({ where: { id: parsed.id } });
      if (!currentUser) {
        throw new Error("User not found.");
      }
      if (currentUser.role === "OWNER" && (parsed.role !== "OWNER" || !parsed.isActive)) {
        const activeOwners = await prisma.user.count({
          where: { shopId, role: "OWNER", isActive: true },
        });
        if (activeOwners <= 1) {
          throw new Error("Cannot deactivate or demote the sole active Owner.");
        }
      }

      const shouldRevoke =
        Boolean(passwordHash) ||
        currentUser.role !== parsed.role ||
        currentUser.isActive !== parsed.isActive ||
        currentUser.branchId !== finalBranchId ||
        JSON.stringify(currentUser.customPermissions ?? []) !== JSON.stringify(customPermissions);

      await prisma.user.update({
        where: { id: parsed.id, shopId },
        data: {
          name: parsed.name,
          email: parsed.email.toLowerCase().trim(),
          phone: parsed.phone?.trim() || null,
          role: parsed.role,
          isActive: parsed.isActive,
          branchId: finalBranchId,
          customPermissions,
          ...(passwordHash ? { password: passwordHash } : {}),
          ...(pinHash !== undefined ? { supervisorPin: pinHash } : {}),
          ...(shouldRevoke ? { tokenVersion: { increment: 1 } } : {}),
        },
      });
    } else {
      await prisma.user.create({
        data: {
          shopId,
          name: parsed.name,
          email: parsed.email.toLowerCase().trim(),
          phone: parsed.phone?.trim() || null,
          password: passwordHash!,
          role: parsed.role,
          isActive: parsed.isActive,
          branchId: finalBranchId,
          customPermissions,
          supervisorPin: pinHash ?? null,
        },
      });
    }

    revalidatePath(USERS_REVALIDATE_PATH);
    return { success: true };
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.issues[0];
      const fieldName = firstError.path.join(".");
      throw new Error(fieldName ? `${fieldName}: ${firstError.message}` : firstError.message);
    }
    throw new Error(getErrorMessage(error, "An unexpected error occurred while saving the user."));
  }
}

export async function toggleUserStatusAction(userId: string, currentStatus: boolean) {
  const { shopId, userId: actorId } = await requireAuth({
    allowedRoles: ["OWNER"],
    requireActiveStatus: true,
  });

  if (userId === actorId) {
    throw new Error("You cannot change the status of your own account.");
  }

  const target = await prisma.user.findFirst({
    where: { id: userId, shopId },
    select: { role: true },
  });

  if (!target) throw new Error("Staff member not found.");
  if (target.role === "OWNER") {
    throw new Error("Owner accounts cannot be deactivated from staff management.");
  }

  await prisma.user.update({
    where: { id: userId, shopId },
    data: {
      isActive: !currentStatus,
      ...(currentStatus ? { tokenVersion: { increment: 1 } } : {}),
    },
  });

  revalidatePath(USERS_REVALIDATE_PATH);
  return { success: true };
}

export async function deleteUserAction(userId: string) {
  try {
    const { shopId, userId: actorId } = await requireAuth({
      allowedRoles: ["OWNER"],
      requireActiveStatus: true,
    });

    if (userId === actorId) {
      throw new Error("You cannot delete your own active account.");
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId, shopId },
    });

    if (!targetUser) {
      throw new Error("Staff member not found.");
    }

    if (targetUser.role === "OWNER") {
      throw new Error("Store Owner / Admin accounts cannot be deleted from staff management.");
    }

    await prisma.user.delete({
      where: { id: userId, shopId },
    });

    revalidatePath(USERS_REVALIDATE_PATH);
    return { success: true };
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to delete user."));
  }
}
