import { prisma } from "@/lib/prisma";
import { IPaginatedSaleReturns, ISaleReturn } from "@/types/sale";

/**
 * GET SALE RETURNS LIST
 * - Strictly isolated to active branch
 * - Server-side pagination with count + skip/take
 * - Includes line items so historical return slips can be reprinted
 */
export async function getSaleReturns(
  shopId: string,
  branchId?: string | null,
  page = 1,
  pageSize = 10
): Promise<IPaginatedSaleReturns> {
  const where = { shopId, ...(branchId ? { branchId } : {}) };
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);

  const [total, returns] = await Promise.all([
    prisma.saleReturn.count({ where }),
    prisma.saleReturn.findMany({
      where,
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
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
    }),
  ]);

  const items: ISaleReturn[] = returns.map((r) => ({
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

  return { items, total, page: safePage, pageSize: safePageSize };
}
