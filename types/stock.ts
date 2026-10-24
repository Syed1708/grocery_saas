export interface IStockReportKPIs {
  totalProductsCount: number;
  totalStockUnits: number;
  totalCostValue: number;       // Sum(quantity * purchasePrice)
  totalRetailValue: number;     // Sum(quantity * sellingPrice)
  potentialGrossProfit: number; // totalRetailValue - totalCostValue
  lowStockItemsCount: number;
  expiringSoonCount: number;    // Expiring within 30 days
  expiredCount: number;
}

export type StockStatusType = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
export type ExpiryStatusType = "SAFE" | "EXPIRING_SOON" | "EXPIRED" | "NO_EXPIRY";

export interface IStockReportRow {
  stockId: string;
  productId: string;
  productName: string;
  nameEn?: string | null;
  barcode: string;
  sku: string;
  categoryName: string;
  brandName?: string | null;
  sectionCode?: string | null;
  sectionName?: string | null;
  unitCode: string;
  quantity: number;
  alertQuantity: number;
  purchasePrice: number;
  sellingPrice: number;
  totalCostValue: number;
  totalRetailValue: number;
  profitMarginPercent: number;
  expiryDate: Date | string | null;
  daysUntilExpiry: number | null;
  stockStatus: StockStatusType;
  expiryStatus: ExpiryStatusType;
}

export interface IStockFilterParams {
  categoryId?: string;
  brandId?: string;
  sectionId?: string;
  stockStatus?: string;
  expiryStatus?: string;
  search?: string;
}