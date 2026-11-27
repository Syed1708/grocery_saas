import { prisma } from "@/lib/prisma";
import { Prisma, PaymentStatus } from "@/generated/prisma/client";
import {
  ISalesFilterParams,
  ISalesReportKPIs,
  ISaleReportRow,
  IItemVelocityRow,
} from "@/types/index";

const salesReportInclude = {
  customer: { select: { name: true, phone: true } },
  cashier: { select: { name: true } },
} satisfies Prisma.SaleInclude;

type SalesReportSale = Prisma.SaleGetPayload<{ include: typeof salesReportInclude }>;

function buildSalesReportWhere(
  shopId: string,
  branchId: string,
  filters: ISalesFilterParams
): Prisma.SaleWhereInput {
  const where: Prisma.SaleWhereInput = {
    shopId,
    branchId,
  };

  if (filters.startDate || filters.endDate) {
    const saleDate: Prisma.DateTimeFilter = {};
    if (filters.startDate) saleDate.gte = new Date(`${filters.startDate}T00:00:00`);
    if (filters.endDate) saleDate.lte = new Date(`${filters.endDate}T23:59:59`);
    where.saleDate = saleDate;
  }

  if (filters.paymentMethod && filters.paymentMethod !== "all") {
    where.paymentMethod = filters.paymentMethod;
  }
  if (filters.paymentStatus && filters.paymentStatus !== "all") {
    where.paymentStatus = filters.paymentStatus as PaymentStatus;
  }

  if (filters.search && filters.search.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { invoiceNo: { contains: q } },
      { customer: { is: { name: { contains: q } } } },
      { customer: { is: { phone: { contains: q } } } },
    ];
  }

  return where;
}

function mapSaleReportRow(s: SalesReportSale): ISaleReportRow {
  return {
    id: s.id,
    invoiceNo: s.invoiceNo,
    saleDate: s.saleDate,
    customerName: s.customer?.name || "নগদ ক্রেতা (Walk-in)",
    customerPhone: s.customer?.phone,
    paymentMethod: s.paymentMethod,
    paymentStatus: s.paymentStatus,
    subtotal: Number(s.subtotal),
    discount: Number(s.discount),
    grandTotal: Number(s.grandTotal),
    paidAmount: Number(s.paidAmount),
    dueAmount: Number(s.dueAmount),
    cashierName: s.cashier?.name || "Cashier",
  };
}

/** All filtered invoices for CSV/PDF exports (never paginated). */
export async function getAllSalesReportInvoices(
  shopId: string,
  branchId: string,
  filters: ISalesFilterParams
): Promise<ISaleReportRow[]> {
  const where = buildSalesReportWhere(shopId, branchId, filters);
  const sales = await prisma.sale.findMany({
    where,
    include: salesReportInclude,
    orderBy: { createdAt: "desc" },
  });
  return sales.map(mapSaleReportRow);
}

export async function getSalesReportData(
  shopId: string,
  branchId: string,
  filters: ISalesFilterParams,
  page = 1,
  pageSize = 10
): Promise<{
  kpis: ISalesReportKPIs;
  invoices: ISaleReportRow[];
  invoicesTotal: number;
  invoicePage: number;
  invoicePageSize: number;
  itemVelocity: IItemVelocityRow[];
}> {
  const where = buildSalesReportWhere(shopId, branchId, filters);
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);

  // 1. KPI Aggregations
  const agg = await prisma.sale.aggregate({
    where,
    _sum: {
      subtotal: true,
      grandTotal: true,
      paidAmount: true,
      dueAmount: true,
      discount: true,
    },
    _count: { id: true },
  });

  const kpis: ISalesReportKPIs = {
    totalGrossSales: Number(agg._sum.subtotal || 0),
    totalNetSales: Number(agg._sum.grandTotal || 0),
    totalCashCollected: Number(agg._sum.paidAmount || 0),
    totalDueOutstanding: Number(agg._sum.dueAmount || 0),
    totalDiscount: Number(agg._sum.discount || 0),
    totalInvoices: agg._count.id || 0,
  };

  // 2. Paginated invoice list
  const [invoicesTotal, sales] = await Promise.all([
    prisma.sale.count({ where }),
    prisma.sale.findMany({
      where,
      include: salesReportInclude,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
    }),
  ]);

  const invoices = sales.map(mapSaleReportRow);

  // 3. Item-wise sales velocity & profit analysis
  const saleItems = await prisma.saleItem.groupBy({
    by: ["productId"],
    where: {
      sale: where,
    },
    _sum: {
      quantity: true,
      lineTotal: true,
    },
    orderBy: {
      _sum: {
        quantity: "desc",
      },
    },
    take: 25,
  });

  const productIds = saleItems.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, barcode: true, purchasePrice: true },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  const itemVelocity: IItemVelocityRow[] = saleItems.map((item) => {
    const prod = productMap.get(item.productId);
    const qty = Number(item._sum.quantity || 0);
    const rev = Number(item._sum.lineTotal || 0);
    const unitCost = Number(prod?.purchasePrice || 0);
    const cost = Math.round(unitCost * qty * 100) / 100;
    const profit = Math.round((rev - cost) * 100) / 100;
    const margin = rev > 0 ? (profit / rev) * 100 : 0;

    return {
      productId: item.productId,
      productName: prod?.name || "Unknown Product",
      barcode: prod?.barcode || "N/A",
      totalQuantity: qty,
      totalRevenue: rev,
      totalProfit: profit,
      marginPercent: Number(margin.toFixed(1)),
    };
  });

  return {
    kpis,
    invoices,
    invoicesTotal,
    invoicePage: safePage,
    invoicePageSize: safePageSize,
    itemVelocity,
  };
}
