// actions/users.ts
"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/guard";
import { revalidatePath } from "next/cache";
import { userSchema } from "@/lib/validations/user";
import { ZodError } from "zod";

export async function saveUserAction(input: any) {
  try {
    const { shopId } = await requireAuth({
      allowedRoles: ["OWNER", "ADMIN", "SUPER_ADMIN" as any],
    });

    let rawData: Record<string, any> = {};
    if (input instanceof FormData) {
      rawData = Object.fromEntries(input.entries());
    } else if (input && typeof input === "object" && "nativeEvent" in input) {
      const form = input.currentTarget as HTMLFormElement;
      const formData = new FormData(form);
      rawData = Object.fromEntries(formData.entries());
    } else if (input && typeof input === "object") {
      rawData = input;
    }

    const parsed = userSchema.parse(rawData);

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

    if (parsed.id) {
      const currentUser = await prisma.user.findUnique({ where: { id: parsed.id } });
      if (currentUser?.role === "OWNER" && (parsed.role !== "OWNER" || !parsed.isActive)) {
        const activeOwners = await prisma.user.count({
          where: { shopId, role: "OWNER", isActive: true },
        });
        if (activeOwners <= 1) {
          throw new Error("Cannot deactivate or demote the sole active Owner.");
        }
      }

      await prisma.user.update({
        where: { id: parsed.id, shopId },
        data: {
          name: parsed.name,
          email: parsed.email.toLowerCase().trim(),
          phone: parsed.phone?.trim() || null,
          role: parsed.role,
          isActive: parsed.isActive,
          branchId: finalBranchId,
          customPermissions: parsed.customPermissions,
          ...(passwordHash ? { password: passwordHash } : {}),
          ...(pinHash !== undefined ? { supervisorPin: pinHash } : {}),
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
          customPermissions: parsed.customPermissions,
          supervisorPin: pinHash ?? null,
        },
      });
    }

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
 // 🛡️ Bulletproof Zod & standard error parser
    const issues = error?.errors || error?.issues;
    if (error instanceof ZodError || Array.isArray(issues)) {
      const firstError = issues?.[0];
      if (firstError) {
        const fieldName = firstError.path?.join(".") || "";
        throw new Error(fieldName ? `${fieldName}: ${firstError.message}` : firstError.message);
      }
    }
    throw new Error(error.message || "An unexpected error occurred while saving the user.");
  }
}

export async function toggleUserStatusAction(userId: string, currentStatus: boolean) {
  const { shopId, userId: actorId } = await requireAuth({
    allowedRoles: ["OWNER", "ADMIN", "SUPER_ADMIN" as any],
  });

  if (userId === actorId) {
    throw new Error("You cannot change the status of your own account.");
  }

  await prisma.user.update({
    where: { id: userId, shopId },
    data: { isActive: !currentStatus },
  });

  revalidatePath("/admin/users");
  return { success: true };
}

// Add this inside actions/users.ts

export async function deleteUserAction(userId: string) {
  try {
    const { shopId, userId: actorId } = await requireAuth({
      allowedRoles: ["OWNER", "ADMIN", "SUPER_ADMIN" as any],
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

    // Protect admin / owner accounts from being deleted here
    if (targetUser.role === "OWNER") {
      throw new Error("Store Owner / Admin accounts cannot be deleted from staff management.");
    }

    await prisma.user.delete({
      where: { id: userId, shopId },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || "Failed to delete user.");
  }
}