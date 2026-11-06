import { prisma } from "@/lib/prisma";
import { ISalesFilterParams, ISalesReportKPIs, ISaleReportRow, IItemVelocityRow } from "@/types/index";

export async function getSalesReportData(
  shopId: string,
  branchId: string,
  filters: ISalesFilterParams
): Promise<{
  kpis: ISalesReportKPIs;
  invoices: ISaleReportRow[];
  itemVelocity: IItemVelocityRow[];
}> {
  // 👈 Simple, clean, and no extra imports needed
  const where: any = {
    shopId,
    branchId,
  };

  // Date range filter on saleDate
  if (filters.startDate || filters.endDate) {
    where.saleDate = {};
    if (filters.startDate) where.saleDate.gte = new Date(`${filters.startDate}T00:00:00`);
    if (filters.endDate) where.saleDate.lte = new Date(`${filters.endDate}T23:59:59`);
  }

  // Payment method & status filters
  if (filters.paymentMethod && filters.paymentMethod !== "all") {
    where.paymentMethod = filters.paymentMethod;
  }
  if (filters.paymentStatus && filters.paymentStatus !== "all") {
    where.paymentStatus = filters.paymentStatus;
  }

  // Invoice or customer search
  if (filters.search && filters.search.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { invoiceNo: { contains: q } },
      { customer: { name: { contains: q } } },
      { customer: { phone: { contains: q } } },
    ];
  }

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

  // 2. Recent Invoices List
  const sales = await prisma.sale.findMany({
    where,
    include: {
      customer: { select: { name: true, phone: true } },
      cashier: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const invoices: ISaleReportRow[] = sales.map((s) => ({
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
  }));

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

  // 🛡️ Accurate Profit Calculation: (rev - unitPurchaseCost * qty)
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

  return { kpis, invoices, itemVelocity };
}