"use server";

import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types/rbac";
import { getAllSalesReportInvoices } from "@/queries/sales-report-queries";
import type { ISalesFilterParams } from "@/types";

export async function fetchSalesReportInvoicesAction(filters: ISalesFilterParams) {
  try {
    const { shopId, activeBranchId } = await requireAuth({
      requiredPermission: PERMISSIONS.REPORTS_SALES,
      requireActiveStatus: true,
    });
    const data = await getAllSalesReportInvoices(shopId, activeBranchId, filters);
    return { success: true as const, data };
  } catch (error) {
    console.error("Failed to load sales report export:", error);
    return { success: false as const, error: "Failed to load sales report export." };
  }
}
