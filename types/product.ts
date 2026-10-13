export interface IProduct {
  id: string;
  name: string;
  nameEn?: string | null;
  barcode: string;
  sku: string;
  description: string | null;
  costPrice: number;
  sellingPrice: number;
  wholesalePrice?: number | null;
  vatPercent: number; // 👈 VAT / Tax %
  expiryDate?: string | null; // 👈 Expiry Date
  stockQuantity: number;
  minStockAlert: number;
  unitId: string;
  unitName: string;
  unitCode: string;
  categoryId: string;
  categoryName: string;
  brandId?: string | null;
  brandName?: string | null;
  sectionId?: string | null;
  sectionName?: string | null;
  bulkUnitName?: string | null;
  conversionFactor: number;
  image?: string | null;
  status: "active" | "inactive"; // 👈 "active" | "inactive"
  createdAt: Date;
}

export type StockStatus = "ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";