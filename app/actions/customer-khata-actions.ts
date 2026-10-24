"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { getCustomerKhataLedger } from "@/queries/customer-due-queries";

export async function fetchCustomerKhataAction(customerId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.shopId) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    const data = await getCustomerKhataLedger(customerId, session.user.shopId);
    return { success: true, data };
  } catch (err) {
    console.error("Failed to load customer khata:", err);
    return { success: false, error: "Database error retrieving ledger." };
  }
}