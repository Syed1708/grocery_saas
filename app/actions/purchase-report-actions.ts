"use server";

import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types/rbac";
import { getPurchaseChalanItems } from "@/queries/purchase-report-queries";

export async function fetchPurchaseChalanItemsAction(purchaseId: string) {
  try {
    const { shopId } = await requireAuth({
      requiredPermission: PERMISSIONS.PURCHASES_VIEW,
      requireActiveStatus: true,
    });
    const items = await getPurchaseChalanItems(purchaseId, shopId);
    return { success: true, data: items };
  } catch (error) {
    console.error("Failed to fetch chalan items:", error);
    return { success: false, error: "Failed to load chalan items." };
  }
}