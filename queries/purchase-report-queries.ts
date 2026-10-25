import { prisma } from "@/lib/prisma";
import { 
  IPurchaseReportKPIs, 
  IPurchaseReportRow, 
  IPurchaseItemDetail,
  IPurchaseFilterParams 
} from "@/types/purchases";

export async function getPurchaseReportData(
  shopId: string,
  branchId: string,
  filters: IPurchaseFilterParams
) {
  // ✅ Plain object: No extra 'Prisma' imports needed!
  const where: any = {
    shopId,
    branchId,
  };

  // Date Range filter
  if (filters.startDate || filters.endDate) {
    where.purchaseDate = {};
    if (filters.startDate) where.purchaseDate.gte = new Date(`${filters.startDate}T00:00:00`);
    if (filters.endDate) where.purchaseDate.lte = new Date(`${filters.endDate}T23:59:59`);
  }

  // Supplier filter
  if (filters.supplierId && filters.supplierId !== "all") {
    where.supplierId = filters.supplierId;
  }

  // Payment status filter
  if (filters.paymentStatus && filters.paymentStatus !== "all") {
    where.paymentStatus = filters.paymentStatus;
  }

  // Search filter
  if (filters.search) {
    where.OR = [
      { chalanNo: { contains: filters.search } },
      { supplier: { name: { contains: filters.search } } },
      { supplier: { companyName: { contains: filters.search } } },
    ];
  }

  // 1. KPI Aggregations
  const agg = await prisma.purchase.aggregate({
    where,
    _sum: {
      grandTotal: true,
      paidAmount: true,
      dueAmount: true,
      discount: true,
    },
    _count: { id: true },
  });

  const kpis: IPurchaseReportKPIs = {
    totalPurchasesAmount: Number(agg._sum.grandTotal || 0),
    totalPaidAmount: Number(agg._sum.paidAmount || 0),
    totalDueAmount: Number(agg._sum.dueAmount || 0),
    totalDiscountAmount: Number(agg._sum.discount || 0),
    totalChalansCount: agg._count.id || 0,
  };

  // 2. Fetch records
  const rawPurchases = await prisma.purchase.findMany({
    where,
    include: {
      supplier: {
        select: { name: true, phone: true, companyName: true },
      },
      _count: {
        select: { items: true },
      },
    },
    orderBy: { purchaseDate: "desc" },
    take: 100,
  });

  const rows: IPurchaseReportRow[] = rawPurchases.map((p) => ({
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
    paymentStatus: p.paymentStatus as any,
    itemCount: p._count.items,
  }));

  return { kpis, rows };
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