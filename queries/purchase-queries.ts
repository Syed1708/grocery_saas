import { prisma } from "@/lib/prisma";
import { IPurchase } from "@/types/purchase";

/**
 * GET PURCHASES CHALANS LIST
 * - Strictly scoped to active branch
 * - Limits to latest 150 chalans (Prevents client RAM overload)
 * - Includes supplier phone and branch name
 */
export async function getPurchases(
  shopId: string,
  branchId?: string | null
): Promise<IPurchase[]> {
  const purchases = await prisma.purchase.findMany({
    where: {
      shopId,
      ...(branchId ? { branchId } : {}), // Strictly scoped to active branch
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
    orderBy: { purchaseDate: "desc" },
    take: 150, // ⚡ Performance optimization
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
    paymentStatus: p.paymentStatus as any,
    notes: p.notes,
    branchId: p.branchId,
    branchName: p.branch?.name || "Main Branch",
    supplierId: p.supplierId,
    supplierName: p.supplier.name,
    supplierCompany: p.supplier.companyName || "",
    supplierPhone: p.supplier.phone || null,
    items: p.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      barcode: item.product.barcode,
      quantity: Number(item.quantity),
      unitCost: Number(item.unitCost),
      commission: Number(item.commission),
      lineTotal: Number(item.lineTotal),
    })),
    createdAt: p.createdAt,
  }));
}