"use server";

import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import { getCustomerKhataLedger } from "@/queries/customer-due-queries";

export async function fetchCustomerKhataAction(customerId: string) {
  try {
    // 🛡️ Zero-Trust Guard: Enforce permissions and active session
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.POS_ACCESS,
      requireActiveStatus: true,
    });

    const data = await getCustomerKhataLedger(customerId, user.shopId);
    if (!data) {
      return { success: false, error: "কাস্টমার বা খাতা রেকর্ড পাওয়া যায়নি।" };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error("Failed to load customer khata:", err);
    return { success: false, error: err.message || "খাতা লেজার লোড করতে ব্যর্থ হয়েছে।" };
  }
}