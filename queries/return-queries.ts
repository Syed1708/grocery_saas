import { prisma } from "@/lib/prisma";
import { ISaleReturn } from "@/types/sale";

/**
 * GET SALE RETURNS LIST
 * - Strictly isolated to active branch
 * - Limits to latest 150 returns (Prevents memory exhaustion)
 * - Includes line items so historical return slips can be reprinted
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
      cashier: { select: { name: true } },
      items: {
        include: {
          product: { select: { name: true, barcode: true } },
          unit: { select: { shortCode: true } },
        },
      },
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
    branchName: r.branch?.name || "Main Branch",
    cashierName: r.cashier?.name || "Staff",
    customerName: r.customer ? r.customer.name : "নগদ ক্রেতা (Walk-in)",
    items: r.items.map((it) => ({
      id: it.id,
      saleReturnId: it.saleReturnId,
      productId: it.productId,
      productName: it.product.name,
      barcode: it.product.barcode,
      unitId: it.unitId,
      unitCode: it.unit?.shortCode || "pcs",
      quantity: Number(it.quantity),
      refundPrice: Number(it.refundPrice),
      itemCondition: it.itemCondition as "RESTOCK" | "DAMAGED",
      createdAt: it.createdAt,
    })),
    createdAt: r.createdAt,
  }));
}
