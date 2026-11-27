"use server";

import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types/rbac";
import { getAllExpenseReportRows } from "@/queries/expense-report-queries";
import type { IExpenseFilterParams } from "@/types/expenses";

export async function fetchExpenseReportRowsAction(filters: IExpenseFilterParams) {
  try {
    const { shopId, activeBranchId } = await requireAuth({
      requiredPermission: PERMISSIONS.REPORTS_EXPENSES,
      requireActiveStatus: true,
    });
    const data = await getAllExpenseReportRows(shopId, activeBranchId, filters);
    return { success: true as const, data };
  } catch (error) {
    console.error("Failed to load expense report export:", error);
    return { success: false as const, error: "Failed to load expense report export." };
  }
}
