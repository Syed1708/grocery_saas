"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { prisma } from "@/lib/prisma";
import { closingSchema } from "@/lib/validations/index";
import { revalidatePath } from "next/cache";

export async function createClosingAction(rawInput: unknown) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.shopId || !session?.user?.branchId) {
    return { success: false, error: "Unauthorized access: Missing active branch session" };
  }

  const { shopId, branchId, id: userId } = session.user;

  const parsed = closingSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;

  try {
    const now = new Date();
    const timeString = now.toTimeString().split(" ")[0]; // "HH:MM:SS"

    const record = await prisma.cashRegister.create({
      data: {
        closingDate: new Date(data.closingDate),
        closingTime: timeString,
        openingCash: data.openingCash,
        cashSales: data.cashSales,
        cashDueCollected: data.cashDueCollected,
        cashOtherIncome: data.cashOtherIncome,
        cashExpenses: data.cashExpenses,
        cashSupplierPaid: data.cashSupplierPaid,
        cashRefunds: data.cashRefunds,
        expectedCash: data.expectedCash,
        countedCash: data.countedCash,
        difference: data.difference,
        totalInvoices: data.totalInvoices,
        notes: data.notes,
        status: "closed",
        shopId,
        branchId,
        userId: userId ?? null,
      },
    });

    revalidatePath("/reports/closings");
    return { success: true, data: record };
  } catch (error) {
    console.error("Failed to commit register closing:", error);
    return { success: false, error: "Database error saving cash register closing." };
  }
}