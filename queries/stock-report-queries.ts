
import { prisma } from "@/lib/prisma";
import { 
  IStockReportKPIs, 
  IStockReportRow, 
  IStockFilterParams,
  StockStatusType,
  ExpiryStatusType
} from "@/types/stock";

export async function getStockReportData(
  shopId: string,
  branchId: string,
  filters: IStockFilterParams
): Promise<{ kpis: IStockReportKPIs; rows: IStockReportRow[] }> {
  const where: any = {
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
  if (filters.search && filters.search.trim()) {
    const q = filters.search.trim();
    where.product = {
      ...where.product,
      OR: [
        { name: { contains: q } },
        { barcode: { contains: q } },
        { sku: { contains: q } },
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

  // Normalize current timestamp to midnight for accurate day calculations
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nowMs = today.getTime();

  let totalUnits = 0;
  let totalCost = 0;
  let totalRetail = 0;
  let lowStockCount = 0;
  let expiringSoonCount = 0;
  let expiredCount = 0;

  const rows: IStockReportRow[] = [];

  for (const s of rawStocks) {
    const qty = Number(s.quantity || 0);
    const pPrice = Number(s.product.purchasePrice || 0);
    const sPrice = Number(s.product.sellingPrice || 0);
    const alertQty = Number(s.product.alertQuantity || 5);

    const costVal = Math.round(qty * pPrice * 100) / 100;
    const retailVal = Math.round(qty * sPrice * 100) / 100;

    totalUnits += qty;
    totalCost += costVal;
    totalRetail += retailVal;

    // 🛡️ FIX: Low Stock includes both OUT_OF_STOCK and LOW_STOCK
    let stockStatus: StockStatusType = "IN_STOCK";
    if (qty <= 0) {
      stockStatus = "OUT_OF_STOCK";
      lowStockCount++; // 👈 Out of stock is counted in low stock alert!
    } else if (qty <= alertQty) {
      stockStatus = "LOW_STOCK";
      lowStockCount++;
    }

    // Expiry Status
    let expiryStatus: ExpiryStatusType = "NO_EXPIRY";
    let daysUntilExpiry: number | null = null;

    if (s.product.expiryDate) {
      const expDate = new Date(s.product.expiryDate);
      expDate.setHours(0, 0, 0, 0);
      daysUntilExpiry = Math.ceil((expDate.getTime() - nowMs) / (1000 * 60 * 60 * 24));

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

    const margin = sPrice > 0 ? ((sPrice - pPrice) / sPrice) * 100 : 0;

    rows.push({
      stockId: s.id,
      productId: s.productId,
      productName: s.product.name,
      nameEn: s.product.nameEn,
      barcode: s.product.barcode,
      sku: s.product.sku,
      categoryName: s.product.category?.name || "সাধারণ",
      brandName: s.product.brand?.name || null,
      sectionCode: s.product.section?.code || null,
      sectionName: s.product.section?.name || null,
      unitCode: s.product.unit?.shortCode || "pcs",
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

  // Post-filter for stockStatus & expiryStatus
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
    totalCostValue: Math.round(totalCost * 100) / 100,
    totalRetailValue: Math.round(totalRetail * 100) / 100,
    potentialGrossProfit: Math.round((totalRetail - totalCost) * 100) / 100,
    lowStockItemsCount: lowStockCount,
    expiringSoonCount,
    expiredCount,
  };

  return { kpis, rows: filteredRows };
}