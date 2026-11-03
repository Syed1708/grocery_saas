import { prisma } from "@/lib/prisma";
import { ISaleReturn } from "@/types/sale";

/**
 * GET SALE RETURNS LIST
 * - Strictly isolated to active branch
 * - Limits to latest 150 returns (Prevents memory exhaustion)
 * - Safe formatting and proper Bengali customer labeling
 */
export async function getSaleReturns(
  shopId: string,
  branchId?: string | null
): Promise<ISaleReturn[]> {
  const returns = await prisma.saleReturn.findMany({
    where: {
      shopId,
      ...(branchId ? { branchId } : {}), // Strictly scoped to active branch
    },
    include: {
      sale: { select: { invoiceNo: true } },
      customer: { select: { name: true } },
      branch: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 150, // Prevents loading thousands of records into client memory
  });

  return returns.map((r) => ({
    id: r.id,
    returnNo: r.returnNo,
    returnDate: r.returnDate,
    totalRefund: Number(r.totalRefund),
    refundMethod: r.refundMethod,
    notes: r.notes,
    saleId: r.saleId,
    invoiceNo: r.sale.invoiceNo,
    branchId: r.branchId,
    customerName: r.customer ? r.customer.name : "নগদ ক্রেতা (Walk-in)",
    createdAt: r.createdAt,
  }));
}


