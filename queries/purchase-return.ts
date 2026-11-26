import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import {
  IPaginatedPurchaseReturns,
  IPurchaseReturnListFilters,
  ReturnReason,
  ReturnSettlementType,
} from "@/types/purchase-return";

export async function getPurchaseReturns(
  shopId: string,
  branchId?: string | null,
  filters: IPurchaseReturnListFilters = {},
  page = 1,
  pageSize = 10
): Promise<IPaginatedPurchaseReturns> {
  const query = filters.q?.trim();
  const settlementType =
    filters.settlementType && filters.settlementType !== "ALL"
      ? (filters.settlementType as ReturnSettlementType)
      : undefined;

  const where: Prisma.PurchaseReturnWhereInput = {
    shopId,
    ...(branchId ? { branchId } : {}),
    ...(query
      ? {
          OR: [
            { returnNo: { contains: query } },
            { supplier: { name: { contains: query } } },
            { supplier: { companyName: { contains: query } } },
          ],
        }
      : {}),
    ...(settlementType ? { settlementType } : {}),
  };

  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);

  const [total, returns] = await Promise.all([
    prisma.purchaseReturn.count({ where }),
    prisma.purchaseReturn.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            companyName: true,
            phone: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        purchase: {
          select: {
            chalanNo: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                barcode: true,
              },
            },
          },
        },
      },
      orderBy: { returnDate: "desc" },
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
    }),
  ]);

  const items = returns.map((r) => ({
    id: r.id,
    returnNo: r.returnNo,
    returnDate: r.returnDate,
    totalQuantity: Number(r.totalQuantity),
    totalAmount: Number(r.totalAmount),
    refundAmount: Number(r.refundAmount),
    dueDeduction: Number(r.dueDeduction),
    settlementType: r.settlementType as ReturnSettlementType,
    paymentMethod: r.paymentMethod,
    notes: r.notes,
    branchId: r.branchId,
    branchName: r.branch?.name || "Main Branch",
    supplierId: r.supplierId,
    supplierName: r.supplier.name,
    supplierCompany: r.supplier.companyName || "",
    supplierPhone: r.supplier.phone || null,
    purchaseId: r.purchaseId,
    purchaseChalanNo: r.purchase?.chalanNo || null,
    items: r.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      barcode: item.product.barcode,
      quantity: Number(item.quantity),
      unitCost: Number(item.unitCost),
      lineTotal: Number(item.lineTotal),
      reason: (item.reason as ReturnReason | null) || "DAMAGED",
    })),
    createdAt: r.createdAt,
  }));

  return { items, total, page: safePage, pageSize: safePageSize };
}