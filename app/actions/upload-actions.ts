"use server";

import { requireAuth } from "@/lib/auth/guard";
import { deleteUploadedFile, saveUploadedFile } from "@/lib/file-storage";
import { PERMISSIONS } from "@/types";

export async function uploadChalanImageAction(formData: FormData) {
  try {
    await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });

    const file = formData.get("file") as File;
    if (!file || file.size === 0) {
      return { success: false, error: "কোন ফাইল নির্বাচন করা হয়নি।" };
    }

    // Safety guard: max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "ফাইলের সাইজ সর্বোচ্চ ৫MB হতে পারবে।" };
    }

    // Uses your helper to save to /public/uploads/chalans/
    const url = await saveUploadedFile(file, "chalans");

    return { success: true, url };
  } catch (error: any) {
    console.error("Upload error:", error);
    return { success: false, error: error.message || "ফাইল আপলোড ব্যর্থ হয়েছে।" };
  }
}

export async function removeChalanImageAction(fileUrl: string) {
  try {
    await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });

    if (fileUrl) {
      await deleteUploadedFile(fileUrl);
    }
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}