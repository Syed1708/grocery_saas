import { prisma } from "@/lib/prisma";
import { IPurchaseReturn } from "@/types/purchase-return";

export async function getPurchaseReturns(
  shopId: string,
  branchId?: string | null
): Promise<IPurchaseReturn[]> {
  const returns = await prisma.purchaseReturn.findMany({
    where: {
      shopId,
      ...(branchId ? { branchId } : {}),
    },
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
    take: 150,
  });

  return returns.map((r) => ({
    id: r.id,
    returnNo: r.returnNo,
    returnDate: r.returnDate,
    totalQuantity: Number(r.totalQuantity),
    totalAmount: Number(r.totalAmount),
    refundAmount: Number(r.refundAmount),
    dueDeduction: Number(r.dueDeduction),
    settlementType: r.settlementType as any,
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
      reason: (item.reason as any) || "DAMAGED",
    })),
    createdAt: r.createdAt,
  }));
}