import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import {
  IPaginatedStockWastages,
  IStockWastageListFilters,
  WastageReason,
} from "@/types/stock-wastage";

export async function getStockWastages(
  shopId: string,
  branchId?: string | null,
  filters: IStockWastageListFilters = {},
  page = 1,
  pageSize = 10
): Promise<IPaginatedStockWastages> {
  const query = filters.q?.trim();
  const reason =
    filters.reason && filters.reason !== "ALL" ? (filters.reason as WastageReason) : undefined;

  const and: Prisma.StockWastageWhereInput[] = [];
  if (query) {
    and.push({
      OR: [
        { wastageNo: { contains: query } },
        { items: { some: { product: { name: { contains: query } } } } },
      ],
    });
  }
  if (reason) and.push({ reason });

  const where: Prisma.StockWastageWhereInput = {
    shopId,
    ...(branchId ? { branchId } : {}),
    ...(and.length ? { AND: and } : {}),
  };
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);

  const [total, records] = await Promise.all([
    prisma.stockWastage.count({ where }),
    prisma.stockWastage.findMany({
      where,
      include: {
        branch: { select: { name: true } },
        items: {
          include: {
            product: {
              select: {
                name: true,
                barcode: true,
                unit: { select: { shortCode: true } },
              },
            },
          },
        },
      },
      orderBy: { date: "desc" },
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
    }),
  ]);

  const items = records.map((r) => ({
    id: r.id,
    wastageNo: r.wastageNo,
    date: r.date,
    totalQuantity: Number(r.totalQuantity),
    totalCost: Number(r.totalCost),
    reason: r.reason as WastageReason,
    notes: r.notes,
    branchId: r.branchId,
    branchName: r.branch?.name || "Main Branch",
    createdAt: r.createdAt,
    items: r.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.product.name,
      barcode: i.product.barcode,
      unitCode: i.product.unit?.shortCode || "pcs",
      quantity: Number(i.quantity),
      unitCost: Number(i.unitCost),
      lineCost: Number(i.lineCost),
      reason: i.reason as WastageReason,
    })),
  }));

  return { items, total, page: safePage, pageSize: safePageSize };
}