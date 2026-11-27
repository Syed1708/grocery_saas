import { prisma } from "@/lib/prisma";
import { Prisma, PaymentStatus } from "@/generated/prisma/client";
import {
  IPurchaseReportKPIs,
  IPurchaseReportRow,
  IPurchaseItemDetail,
  IPurchaseFilterParams,
} from "@/types/purchases";

const purchaseReportInclude = {
  supplier: {
    select: { name: true, phone: true, companyName: true },
  },
  _count: {
    select: { items: true },
  },
} satisfies Prisma.PurchaseInclude;

type PurchaseReportPurchase = Prisma.PurchaseGetPayload<{
  include: typeof purchaseReportInclude;
}>;

function buildPurchaseReportWhere(
  shopId: string,
  branchId: string,
  filters: IPurchaseFilterParams,
  dueOnly = false
): Prisma.PurchaseWhereInput {
  const where: Prisma.PurchaseWhereInput = {
    shopId,
    branchId,
  };

  if (filters.startDate || filters.endDate) {
    const purchaseDate: Prisma.DateTimeFilter = {};
    if (filters.startDate) purchaseDate.gte = new Date(`${filters.startDate}T00:00:00`);
    if (filters.endDate) purchaseDate.lte = new Date(`${filters.endDate}T23:59:59`);
    where.purchaseDate = purchaseDate;
  }

  if (filters.supplierId && filters.supplierId !== "all") {
    where.supplierId = filters.supplierId;
  }

  if (filters.paymentStatus && filters.paymentStatus !== "all") {
    where.paymentStatus = filters.paymentStatus as PaymentStatus;
  }

  if (filters.search) {
    where.OR = [
      { chalanNo: { contains: filters.search } },
      { supplier: { name: { contains: filters.search } } },
      { supplier: { companyName: { contains: filters.search } } },
    ];
  }

  if (dueOnly) {
    where.dueAmount = { gt: 0 };
  }

  return where;
}

function mapPurchaseReportRow(p: PurchaseReportPurchase): IPurchaseReportRow {
  return {
    id: p.id,
    chalanNo: p.chalanNo,
    purchaseDate: p.purchaseDate,
    supplierId: p.supplierId,
    supplierName: p.supplier.name,
    supplierPhone: p.supplier.phone,
    companyName: p.supplier.companyName,
    totalQuantity: Number(p.totalQuantity),
    subtotal: Number(p.subtotal),
    discount: Number(p.discount),
    transportCost: Number(p.transportCost),
    grandTotal: Number(p.grandTotal),
    paidAmount: Number(p.paidAmount),
    dueAmount: Number(p.dueAmount),
    paymentMethod: p.paymentMethod,
    paymentStatus: p.paymentStatus as PaymentStatus,
    itemCount: p._count.items,
  };
}

/** All filtered rows for CSV/PDF exports (never paginated). */
export async function getAllPurchaseReportRows(
  shopId: string,
  branchId: string,
  filters: IPurchaseFilterParams,
  dueOnly = false
): Promise<IPurchaseReportRow[]> {
  const where = buildPurchaseReportWhere(shopId, branchId, filters, dueOnly);
  const rawPurchases = await prisma.purchase.findMany({
    where,
    include: purchaseReportInclude,
    orderBy: { purchaseDate: "desc" },
  });
  return rawPurchases.map(mapPurchaseReportRow);
}

export async function getPurchaseReportData(
  shopId: string,
  branchId: string,
  filters: IPurchaseFilterParams,
  page = 1,
  pageSize = 10,
  dueOnly = false
): Promise<{
  kpis: IPurchaseReportKPIs;
  rows: IPurchaseReportRow[];
  rowsTotal: number;
  rowsPage: number;
  rowsPageSize: number;
  dueTotal: number;
}> {
  const baseWhere = buildPurchaseReportWhere(shopId, branchId, filters);
  const tableWhere = buildPurchaseReportWhere(shopId, branchId, filters, dueOnly);
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);

  const [agg, dueTotal, rowsTotal, rawPurchases] = await Promise.all([
    prisma.purchase.aggregate({
      where: baseWhere,
      _sum: {
        grandTotal: true,
        paidAmount: true,
        dueAmount: true,
        discount: true,
      },
      _count: { id: true },
    }),
    prisma.purchase.count({
      where: { ...baseWhere, dueAmount: { gt: 0 } },
    }),
    prisma.purchase.count({ where: tableWhere }),
    prisma.purchase.findMany({
      where: tableWhere,
      include: purchaseReportInclude,
      orderBy: { purchaseDate: "desc" },
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
    }),
  ]);

  const kpis: IPurchaseReportKPIs = {
    totalPurchasesAmount: Number(agg._sum.grandTotal || 0),
    totalPaidAmount: Number(agg._sum.paidAmount || 0),
    totalDueAmount: Number(agg._sum.dueAmount || 0),
    totalDiscountAmount: Number(agg._sum.discount || 0),
    totalChalansCount: agg._count.id || 0,
  };

  return {
    kpis,
    rows: rawPurchases.map(mapPurchaseReportRow),
    rowsTotal,
    rowsPage: safePage,
    rowsPageSize: safePageSize,
    dueTotal,
  };
}

// Fetch line-items for single Chalan modal
export async function getPurchaseChalanItems(
  purchaseId: string,
  shopId: string
): Promise<IPurchaseItemDetail[]> {
  const items = await prisma.purchaseItem.findMany({
    where: {
      purchaseId,
      purchase: { shopId },
    },
    include: {
      product: { select: { name: true, barcode: true } },
      unit: { select: { shortCode: true } },
    },
  });

  return items.map((it) => ({
    id: it.id,
    productId: it.productId,
    productName: it.product.name,
    barcode: it.product.barcode,
    unitCode: it.unit?.shortCode || "pcs",
    quantity: Number(it.quantity),
    unitCost: Number(it.unitCost),
    lineTotal: Number(it.lineTotal),
  }));
}
