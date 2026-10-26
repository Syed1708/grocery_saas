"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createClosingAction(payload: {
  openingCash: number;
  cashSales: number;
  cashDueCollected: number;
  cashOtherIncome: number;
  cashExpenses: number;
  cashSupplierPaid: number;
  cashRefunds: number;
  expectedCash: number;
  countedCash: number;
  difference: number;
  totalInvoices: number;
  notes?: string;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.shopId || !session?.user?.branchId) {
    return { success: false, error: "Unauthorized access: Active branch required." };
  }

  const { shopId, branchId, id: userId } = session.user;

  try {
    const now = new Date();
    const timeString = now.toTimeString().split(" ")[0]; // "HH:MM:SS"

    const record = await prisma.cashRegister.create({
      data: {
        closingDate: now,
        closingTime: timeString,
        openingCash: payload.openingCash,
        cashSales: payload.cashSales,
        cashDueCollected: payload.cashDueCollected,
        cashOtherIncome: payload.cashOtherIncome,
        cashExpenses: payload.cashExpenses,
        cashSupplierPaid: payload.cashSupplierPaid,
        cashRefunds: payload.cashRefunds,
        expectedCash: payload.expectedCash,
        countedCash: payload.countedCash,
        difference: payload.difference,
        totalInvoices: payload.totalInvoices,
        notes: payload.notes || null,
        status: "closed",
        shopId,
        branchId,
        userId: userId ?? null,
      },
    });

    revalidatePath("/reports/closings");
    revalidatePath("/admin/reports/closings");
    revalidatePath("/reports");
    return { success: true, data: record };
  } catch (error) {
    console.error("Failed to save register closing:", error);
    return { success: false, error: "Database error committing Z-Report closing." };
  }
}