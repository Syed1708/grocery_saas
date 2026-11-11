import { prisma } from "@/lib/prisma";
import { IStockTransfer } from "@/types/stock-transfer";

export async function getStockTransfers(
  shopId: string,
  branchId?: string | null
): Promise<IStockTransfer[]> {
  const transfers = await prisma.stockTransfer.findMany({
    where: {
      shopId,
      ...(branchId
        ? {
            OR: [{ fromBranchId: branchId }, { toBranchId: branchId }],
          }
        : {}),
    },
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
    take: 150,
  });

  return transfers.map((t) => ({
    id: t.id,
    transferNo: t.transferNo,
    dispatchDate: t.dispatchDate,
    receiveDate: t.receiveDate,
    status: t.status as any,
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
}