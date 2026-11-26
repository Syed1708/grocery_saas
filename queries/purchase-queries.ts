import { prisma } from "@/lib/prisma";
import { Prisma, PaymentStatus, PurchaseOrderStatus } from "@/generated/prisma/client";
import {
  IPaginatedPurchaseOrders,
  IPurchaseOrderListFilters,
} from "@/types/purchase-order";
import { IPaginatedPurchases, IPurchaseListFilters } from "@/types/purchase";

/**
 * GET PURCHASES CHALANS LIST
 * - Strictly scoped to active branch
 * - Server-side search, status filtering and pagination
 * - Includes supplier phone and branch name
 */
export async function getPurchases(
  shopId: string,
  branchId?: string | null,
  filters: IPurchaseListFilters = {},
  page = 1,
  pageSize = 10
): Promise<IPaginatedPurchases> {
  const query = filters.q?.trim();
  const status =
    filters.status && filters.status !== "ALL" ? (filters.status as PaymentStatus) : undefined;

  const where: Prisma.PurchaseWhereInput = {
    shopId,
    ...(branchId ? { branchId } : {}), // Strictly scoped to active branch
    ...(query
      ? {
          OR: [
            { chalanNo: { contains: query } },
            { supplier: { name: { contains: query } } },
            { supplier: { companyName: { contains: query } } },
          ],
        }
      : {}),
    ...(status ? { paymentStatus: status } : {}),
  };

  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);

  const [total, purchases] = await Promise.all([
    prisma.purchase.count({ where }),
    prisma.purchase.findMany({
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
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
    }),
  ]);

  const items = purchases.map((p) => ({
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
    paymentStatus: p.paymentStatus as PaymentStatus,
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

  return { items, total, page: safePage, pageSize: safePageSize };
}

export async function getPurchaseOrders(
  shopId: string,
  branchId?: string | null,
  filters: IPurchaseOrderListFilters = {},
  page = 1,
  pageSize = 10
): Promise<IPaginatedPurchaseOrders> {
  const query = filters.q?.trim();
  const status =
    filters.status && filters.status !== "ALL"
      ? (filters.status as PurchaseOrderStatus)
      : undefined;

  const where: Prisma.PurchaseOrderWhereInput = {
    shopId,
    ...(branchId ? { branchId } : {}),
    ...(query
      ? {
          OR: [
            { orderNo: { contains: query } },
            { supplier: { name: { contains: query } } },
            { supplier: { companyName: { contains: query } } },
          ],
        }
      : {}),
    ...(status ? { status } : {}),
  };

  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);

  const [total, orders] = await Promise.all([
    prisma.purchaseOrder.count({ where }),
    prisma.purchaseOrder.findMany({
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
            name: true,
          },
        },
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

  const items = orders.map((o) => ({
    id: o.id,
    orderNo: o.orderNo,
    orderDate: o.orderDate,
    status: o.status as PurchaseOrderStatus,
    totalItems: o.totalItems,
    estimatedTotal: Number(o.estimatedTotal),
    notes: o.notes,
    supplierId: o.supplierId,
    supplierName: o.supplier.name,
    supplierCompany: o.supplier.companyName || "",
    supplierPhone: o.supplier.phone || null,
    branchName: o.branch?.name || "Main Branch",
    createdAt: o.createdAt,
    items: o.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.product.name,
      barcode: i.product.barcode,
      unitCode: i.product.unit?.shortCode || "pcs",
      currentStock: Number(i.currentStock),
      quantity: Number(i.quantity),
      unitCost: Number(i.unitCost),
      lineTotal: Number(i.lineTotal),
    })),
  }));

  return { items, total, page: safePage, pageSize: safePageSize };
}