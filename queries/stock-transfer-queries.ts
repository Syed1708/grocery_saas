import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import {
  IPaginatedStockTransfers,
  IStockTransferListFilters,
  TransferStatus,
} from "@/types/stock-transfer";

export async function getStockTransfers(
  shopId: string,
  branchId?: string | null,
  filters: IStockTransferListFilters = {},
  page = 1,
  pageSize = 10
): Promise<IPaginatedStockTransfers> {
  const query = filters.q?.trim();
  const direction = filters.direction && filters.direction !== "ALL" ? filters.direction : undefined;

  const and: Prisma.StockTransferWhereInput[] = [];
  if (branchId) {
    and.push({ OR: [{ fromBranchId: branchId }, { toBranchId: branchId }] });
  }
  if (query) {
    and.push({
      OR: [
        { transferNo: { contains: query } },
        { fromBranch: { name: { contains: query } } },
        { toBranch: { name: { contains: query } } },
      ],
    });
  }
  if (direction === "IN_TRANSIT") and.push({ status: "DISPATCHED" });
  if (direction === "INBOUND" && branchId) and.push({ toBranchId: branchId });
  if (direction === "OUTBOUND" && branchId) and.push({ fromBranchId: branchId });

  const where: Prisma.StockTransferWhereInput = {
    shopId,
    ...(and.length ? { AND: and } : {}),
  };
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);

  const [total, transfers] = await Promise.all([
    prisma.stockTransfer.count({ where }),
    prisma.stockTransfer.findMany({
      where,
      include: {
        fromBranch: { select: { name: true } },
        toBranch: { select: { name: true } },
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
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
    }),
  ]);

  const items = transfers.map((t) => ({
    id: t.id,
    transferNo: t.transferNo,
    dispatchDate: t.dispatchDate,
    receiveDate: t.receiveDate,
    status: t.status as TransferStatus,
    totalItems: t.totalItems,
    totalQuantity: Number(t.totalQuantity),
    totalCost: Number(t.totalCost),
    notes: t.notes,
    driverName: t.driverName,
    driverPhone: t.driverPhone,
    vehicleNo: t.vehicleNo,
    fromBranchId: t.fromBranchId,
    fromBranchName: t.fromBranch?.name || "Source Branch",
    toBranchId: t.toBranchId,
    toBranchName: t.toBranch?.name || "Destination Branch",
    createdAt: t.createdAt,
    items: t.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.product.name,
      barcode: i.product.barcode,
      unitCode: i.product.unit?.shortCode || "pcs",
      quantitySent: Number(i.quantitySent),
      quantityReceived: i.quantityReceived !== null ? Number(i.quantityReceived) : null,
      transitDamage: Number(i.transitDamage || 0),
      unitCost: Number(i.unitCost),
      lineCost: Number(i.lineCost),
    })),
  }));

  return { items, total, page: safePage, pageSize: safePageSize };
}