import { prisma } from "@/lib/prisma";
import { IPurchase } from "@/types";

export async function getPurchases(
  shopId: string,
  branchId?: string | null
): Promise<IPurchase[]> {
  const purchases = await prisma.purchase.findMany({
    where: {
      shopId,
      ...(branchId ? { branchId } : {}),
    },
    include: {
      supplier: { select: { name: true, companyName: true } },
      items: {
        include: {
          product: { select: { name: true } },
        },
      },
    },
    orderBy: { purchaseDate: "desc" },
  });

  return purchases.map((p) => ({
    id: p.id,
    chalanNo: p.chalanNo,
    purchaseDate: p.purchaseDate,
    subtotal: Number(p.subtotal),
    totalQuantity: Number(p.totalQuantity),
    discount: Number(p.discount),
    transportCost: Number(p.transportCost),
    vatPercent: Number(p.vatPercent),
    vatAmount: Number(p.vatAmount),
    grandTotal: Number(p.grandTotal),
    previousDue: Number(p.previousDue),
    paidAmount: Number(p.paidAmount),
    dueAmount: Number(p.dueAmount),
    paymentMethod: p.paymentMethod,
    paymentStatus: p.paymentStatus,
    notes: p.notes,
    supplierId: p.supplierId,
    supplierName: p.supplier.name,
    supplierCompany: p.supplier.companyName || "",
    items: p.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      quantity: Number(item.quantity),
      unitCost: Number(item.unitCost),
      commission: Number(item.commission),
      lineTotal: Number(item.lineTotal),
    })),
    createdAt: p.createdAt,
  }));
}