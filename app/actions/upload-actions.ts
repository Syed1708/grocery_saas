"use server";

import { requireAuth } from "@/lib/auth/guard";
import { deleteUploadedFile, saveUploadedFile } from "@/lib/file-storage";
import { PERMISSIONS } from "@/types";
import { getErrorMessage } from "@/lib/utils";

export async function uploadChalanImageAction(formData: FormData) {
  try {
    await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });

    const rawFile = formData.get("file");
    const file = rawFile instanceof File ? rawFile : null;
    if (!file || file.size === 0) {
      return { success: false, error: "কোন ফাইল নির্বাচন করা হয়নি।" };
    }

    // Uses your helper to save to /public/uploads/chalans/
    const url = await saveUploadedFile(file, "chalans");

    return { success: true, url };
  } catch (error) {
    console.error("Upload error:", error);
    return { success: false, error: getErrorMessage(error, "ফাইল আপলোড ব্যর্থ হয়েছে।") };
  }
}

export async function removeChalanImageAction(fileUrl: string) {
  try {
    await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });

    if (!fileUrl.startsWith("/uploads/chalans/")) {
      return { success: false, error: "অবৈধ ফাইল পাথ।" };
    }

    await deleteUploadedFile(fileUrl);
    return { success: true };
  } catch {
    return { success: false };
  }
}