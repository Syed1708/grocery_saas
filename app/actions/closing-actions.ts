"use server";

import { requireAuth } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PERMISSIONS } from "@/types";
import { getErrorMessage } from "@/lib/utils";
import { getCurrentShiftSummary } from "@/queries/closing-queries";

const CLOSING_REVALIDATE_PATHS = [
  "/dashboard/admin/closings",
  "/dashboard/admin/reports/closings",
  "/dashboard/admin/reports",
  "/dashboard",
];

/**
 * Commits a day-end Z-report.
 * All financial totals are recomputed on the server; the client only supplies
 * the physically counted cash and an optional audit note.
 */
export async function createClosingAction(payload: {
  countedCash: number;
  notes?: string;
}) {
  try {
    const { shopId, activeBranchId: branchId, userId } = await requireAuth({
      requiredPermission: PERMISSIONS.REPORTS_CLOSING_Z,
      requireActiveStatus: true,
    });

    if (!branchId) {
      return { success: false, error: "সক্রিয় ব্রাঞ্চ নির্ধারণ করা নেই।" };
    }

    const countedCash = Number(payload.countedCash);
    if (!Number.isFinite(countedCash) || countedCash < 0) {
      return { success: false, error: "Counted cash must be a valid non-negative amount." };
    }

    const summary = await getCurrentShiftSummary(shopId, branchId);
    const difference = Math.round((countedCash - summary.expectedCash) * 100) / 100;

    const now = new Date();
    const timeString = now.toTimeString().split(" ")[0];

    const record = await prisma.cashRegister.create({
      data: {
        closingDate: now,
        closingTime: timeString,
        openingCash: summary.openingCash,
        cashSales: summary.cashSales,
        cashDueCollected: summary.cashDueCollected,
        cashOtherIncome: summary.cashOtherIncome,
        cashExpenses: summary.cashExpenses,
        cashSupplierPaid: summary.cashSupplierPaid,
        cashRefunds: summary.cashRefunds,
        expectedCash: summary.expectedCash,
        countedCash,
        difference,
        totalInvoices: summary.totalInvoices,
        notes: payload.notes?.trim() || null,
        status: "closed",
        shopId,
        branchId,
        userId: userId ?? null,
      },
    });

    for (const path of CLOSING_REVALIDATE_PATHS) revalidatePath(path);
    return { success: true, data: record };
  } catch (error) {
    console.error("Failed to save register closing:", error);
    return {
      success: false,
      error: getErrorMessage(error, "Database error committing Z-Report closing."),
    };
  }
}
