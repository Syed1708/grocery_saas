"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { saveUploadedFile, deleteUploadedFile } from "@/lib/file-storage";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(70),
  phone: z.string().min(5, "Phone number is too short").max(20).optional().nullable(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirm password do not match",
    path: ["confirmPassword"],
  });

export async function updateProfileAction(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const validated = profileSchema.safeParse({
      name: formData.get("name")?.toString().trim(),
      phone: formData.get("phone")?.toString().trim() || null,
    });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { name, phone } = validated.data;
    const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } });

    // Handle Profile Image Upload
    const imageFile = formData.get("profileImage") as File | null;
    let imageUrl = currentUser?.profileImage;

    if (imageFile && imageFile.size > 0) {
      if (currentUser?.profileImage) {
        await deleteUploadedFile(currentUser.profileImage);
      }
      imageUrl = await saveUploadedFile(imageFile, "profiles");
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { name, phone, profileImage: imageUrl },
    });

    revalidatePath("/dashboard/profile");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update profile." };
  }
}

export async function updatePasswordAction(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const validated = passwordSchema.safeParse({
      currentPassword: formData.get("currentPassword")?.toString(),
      newPassword: formData.get("newPassword")?.toString(),
      confirmPassword: formData.get("confirmPassword")?.toString(),
    });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { currentPassword, newPassword } = validated.data;

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) throw new Error("User not found");

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return { success: false, error: "Incorrect current password." };
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashed },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to change password." };
  }
}