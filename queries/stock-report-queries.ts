import { prisma } from "@/lib/prisma";
import { 
  IStockReportKPIs, 
  IStockReportRow, 
  IStockFilterParams,
  StockStatusType,
  ExpiryStatusType
} from "@/types/stock";
import { Prisma } from "@prisma/client";

export async function getStockReportData(
  shopId: string,
  branchId: string,
  filters: IStockFilterParams
) {
  const where: Prisma.ProductStockWhereInput = {
    branchId,
    product: {
      shopId,
      status: "active",
    },
  };

  // 1. Dynamic Filters
  if (filters.categoryId && filters.categoryId !== "all") {
    where.product = { ...where.product, categoryId: filters.categoryId };
  }
  if (filters.brandId && filters.brandId !== "all") {
    where.product = { ...where.product, brandId: filters.brandId };
  }
  if (filters.sectionId && filters.sectionId !== "all") {
    where.product = { ...where.product, sectionId: filters.sectionId };
  }
  if (filters.search) {
    where.product = {
      ...where.product,
      OR: [
        { name: { contains: filters.search } },
        { barcode: { contains: filters.search } },
        { sku: { contains: filters.search } },
      ],
    };
  }

  // 2. Fetch Stock Records with relations
  const rawStocks = await prisma.productStock.findMany({
    where,
    include: {
      product: {
        include: {
          category: { select: { name: true } },
          brand: { select: { name: true } },
          section: { select: { name: true, code: true } },
          unit: { select: { shortCode: true } },
        },
      },
    },
    orderBy: { product: { name: "asc" } },
  });

  const now = new Date().getTime();
  let totalUnits = 0;
  let totalCost = 0;
  let totalRetail = 0;
  let lowStockCount = 0;
  let expiringSoonCount = 0;
  let expiredCount = 0;

  const rows: IStockReportRow[] = [];

  for (const s of rawStocks) {
    const qty = Number(s.quantity);
    const pPrice = Number(s.product.purchasePrice);
    const sPrice = Number(s.product.sellingPrice);
    const alertQty = Number(s.product.alertQuantity);

    const costVal = qty * pPrice;
    const retailVal = qty * sPrice;

    totalUnits += qty;
    totalCost += costVal;
    totalRetail += retailVal;

    // Stock Status
    let stockStatus: StockStatusType = "IN_STOCK";
    if (qty <= 0) stockStatus = "OUT_OF_STOCK";
    else if (qty <= alertQty) {
      stockStatus = "LOW_STOCK";
      lowStockCount++;
    }

    // Expiry Status
    let expiryStatus: ExpiryStatusType = "NO_EXPIRY";
    let daysUntilExpiry: number | null = null;

    if (s.product.expiryDate) {
      const expTime = new Date(s.product.expiryDate).getTime();
      daysUntilExpiry = Math.ceil((expTime - now) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry < 0) {
        expiryStatus = "EXPIRED";
        expiredCount++;
      } else if (daysUntilExpiry <= 30) {
        expiryStatus = "EXPIRING_SOON";
        expiringSoonCount++;
      } else {
        expiryStatus = "SAFE";
      }
    }

    // Profit margin on retail
    const margin = sPrice > 0 ? ((sPrice - pPrice) / sPrice) * 100 : 0;

    rows.push({
      stockId: s.id,
      productId: s.productId,
      productName: s.product.name,
      nameEn: s.product.nameEn,
      barcode: s.product.barcode,
      sku: s.product.sku,
      categoryName: s.product.category.name,
      brandName: s.product.brand?.name || null,
      sectionCode: s.product.section?.code || null,
      sectionName: s.product.section?.name || null,
      unitCode: s.product.unit.shortCode,
      quantity: qty,
      alertQuantity: alertQty,
      purchasePrice: pPrice,
      sellingPrice: sPrice,
      totalCostValue: costVal,
      totalRetailValue: retailVal,
      profitMarginPercent: Number(margin.toFixed(1)),
      expiryDate: s.product.expiryDate,
      daysUntilExpiry,
      stockStatus,
      expiryStatus,
    });
  }

  // 3. Post-filter for stockStatus & expiryStatus
  let filteredRows = rows;
  if (filters.stockStatus && filters.stockStatus !== "all") {
    filteredRows = filteredRows.filter((r) => r.stockStatus === filters.stockStatus);
  }
  if (filters.expiryStatus && filters.expiryStatus !== "all") {
    filteredRows = filteredRows.filter((r) => r.expiryStatus === filters.expiryStatus);
  }

  const kpis: IStockReportKPIs = {
    totalProductsCount: rows.length,
    totalStockUnits: totalUnits,
    totalCostValue: totalCost,
    totalRetailValue: totalRetail,
    potentialGrossProfit: totalRetail - totalCost,
    lowStockItemsCount: lowStockCount,
    expiringSoonCount,
    expiredCount,
  };

  return { kpis, rows: filteredRows };
}