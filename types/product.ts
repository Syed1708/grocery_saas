export interface IProduct {
  id: string;
  name: string;
  barcode: string;
  description: string | null;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStockAlert: number;
  unitId: string;
  unitName: string;
  unitCode: string;
  bulkUnitName: string | null;
  conversionFactor: number;
  image: string | null;
  categoryId: string;
  categoryName: string;
  createdAt: Date;
}

export type StockStatus = "ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";