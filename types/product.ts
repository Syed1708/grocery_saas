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
  stockQuantity: number; // Branch-specific stock
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
  conversionFactor?: number;
  image?: string | null;
  status?: string;
  createdAt: Date;
}

export type StockStatus = "ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";