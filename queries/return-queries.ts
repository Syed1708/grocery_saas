import { prisma } from "@/lib/prisma";
import { ISaleReturn } from "@/types";

export async function getSaleReturns(
  shopId: string,
  branchId?: string | null
): Promise<ISaleReturn[]> {
  const returns = await prisma.saleReturn.findMany({
    where: {
      shopId,
      ...(branchId ? { branchId } : {}),
    },
    include: {
      sale: { select: { invoiceNo: true } },
      customer: { select: { name: true } },
    },
    orderBy: { returnDate: "desc" },
  });

  return returns.map((r) => ({
    id: r.id,
    returnNo: r.returnNo,
    returnDate: r.returnDate,
    totalRefund: Number(r.totalRefund),
    refundMethod: r.refundMethod,
    notes: r.notes,
    invoiceNo: r.sale.invoiceNo,
    customerName: r.customer?.name || "Walk-in Customer",
    createdAt: r.createdAt,
  }));
}

/**
 * Helper to search an invoice by number for processing returns
 */
export async function findSaleForReturn(invoiceNo: string, shopId: string) {
  const cleanNo = invoiceNo.replace("#", "").trim();
  const sale = await prisma.sale.findFirst({
    where: { shopId, invoiceNo: cleanNo },
    include: {
      customer: { select: { id: true, name: true, phone: true, currentDue: true } },
      items: {
        include: {
          product: { select: { name: true } },
          unit: { select: { shortCode: true } },
        },
      },
    },
  });

  if (!sale) return null;

  return {
    id: sale.id,
    invoiceNo: sale.invoiceNo,
    saleDate: sale.saleDate,
    grandTotal: Number(sale.grandTotal),
    customerName: sale.customer?.name || "Walk-in Customer",
    customerDue: Number(sale.customer?.currentDue || 0),
    items: sale.items.map((it) => ({
      id: it.id,
      productId: it.productId,
      productName: it.product.name,
      unitCode: it.unit?.shortCode || "pcs",
      quantity: Number(it.quantity),
      unitPrice: Number(it.unitPrice),
      lineTotal: Number(it.lineTotal),
    })),
  };
}

