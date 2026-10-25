import { prisma } from "@/lib/prisma";
import { ISale } from "@/types";

/**
 * Fast query for POS Catalog
 */
export async function getPosCatalog(shopId: string, branchId?: string | null) {
  const products = await prisma.product.findMany({
    where: { shopId, status: "active" },
    include: {
      category: { select: { id: true, name: true } },
      unit: { select: { id: true, name: true, shortCode: true } },
      stocks: branchId ? { where: { branchId } } : true,
    },
    orderBy: { name: "asc" },
  });

  return products.map((p) => {
    const stockAvailable = p.stocks.reduce((sum, s) => sum + Number(s.quantity || 0), 0);
    return {
      id: p.id,
      name: p.name,
      nameEn: p.nameEn,
      barcode: p.barcode,
      unitPrice: Number(p.sellingPrice),
      costPrice: Number(p.purchasePrice),
      unitId: p.unitId,
      unitCode: p.unit.shortCode,
      categoryId: p.categoryId,
      categoryName: p.category.name,
      image: p.image,
      stockAvailable,
    };
  });
}

/**
 * Get Sales Invoices List
 */
export async function getSales(shopId: string, branchId?: string | null): Promise<ISale[]> {
  const sales = await prisma.sale.findMany({
    where: {
      shopId,
      ...(branchId ? { branchId } : {}),
    },
    include: {
      customer: { select: { name: true, phone: true } },
      cashier: { select: { name: true } },
      branch: { select: { name: true } },
      items: {
        include: {
          product: { select: { name: true } },
          unit: { select: { shortCode: true } },
        },
      },
    },
    orderBy: { saleDate: "desc" },
  });

  return sales.map((s) => ({
    id: s.id,
    invoiceNo: s.invoiceNo,
    saleDate: s.saleDate,
    subtotal: Number(s.subtotal),
    discount: Number(s.discount),
    vatPercent: Number(s.vatPercent),
    vatAmount: Number(s.vatAmount),
    grandTotal: Number(s.grandTotal),
    paidAmount: Number(s.paidAmount),
    dueAmount: Number(s.dueAmount),
    changeAmount: Number(s.changeAmount),
    paymentMethod: s.paymentMethod,
    paymentStatus: s.paymentStatus as any,
    notes: s.notes,
    customerId: s.customerId,
    customerName: s.customer?.name || "Walk-in Customer",
    customerPhone: s.customer?.phone || null,
    cashierName: s.cashier?.name || "Cashier",
    branchId: s.branchId,
    branchName: s.branch.name,
    items: s.items.map((it) => ({
      id: it.id,
      productId: it.productId,
      productName: it.product.name,
      unitCode: it.unit?.shortCode,
      quantity: Number(it.quantity),
      unitPrice: Number(it.unitPrice),
      purchaseCost: Number(it.purchaseCost),
      discount: Number(it.discount),
      lineTotal: Number(it.lineTotal),
    })),
    createdAt: s.createdAt,
  }));
}