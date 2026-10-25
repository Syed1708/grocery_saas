"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { getPurchaseChalanItems } from "@/queries/purchase-report-queries";

export async function fetchPurchaseChalanItemsAction(purchaseId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.shopId) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    const items = await getPurchaseChalanItems(purchaseId, session.user.shopId);
    return { success: true, data: items };
  } catch (error) {
    console.error("Failed to fetch chalan items:", error);
    return { success: false, error: "Failed to load chalan items." };
  }
}