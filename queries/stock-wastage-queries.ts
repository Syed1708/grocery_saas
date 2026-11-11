import { prisma } from "@/lib/prisma";
import { IStockWastage } from "@/types/stock-wastage";

export async function getStockWastages(
  shopId: string,
  branchId?: string | null
): Promise<IStockWastage[]> {
  const records = await prisma.stockWastage.findMany({
    where: {
      shopId,
      ...(branchId ? { branchId } : {}),
    },
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
    take: 150,
  });

  return records.map((r) => ({
    id: r.id,
    wastageNo: r.wastageNo,
    date: r.date,
    totalQuantity: Number(r.totalQuantity),
    totalCost: Number(r.totalCost),
    reason: r.reason as any,
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
      reason: i.reason as any,
    })),
  }));
}