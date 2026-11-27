"use server";

import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types/rbac";
import {
  getAllPurchaseReportRows,
  getPurchaseChalanItems,
} from "@/queries/purchase-report-queries";
import type { IPurchaseFilterParams } from "@/types/purchases";

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

export async function fetchPurchaseReportRowsAction(
  filters: IPurchaseFilterParams,
  dueOnly: boolean
) {
  try {
    const { shopId, activeBranchId } = await requireAuth({
      requiredPermission: PERMISSIONS.REPORTS_PURCHASES,
      requireActiveStatus: true,
    });
    const data = await getAllPurchaseReportRows(shopId, activeBranchId, filters, dueOnly);
    return { success: true as const, data };
  } catch (error) {
    console.error("Failed to load purchase report export:", error);
    return { success: false as const, error: "Failed to load purchase report export." };
  }
}