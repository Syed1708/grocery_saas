

export interface IStockReportItem {
  id: string;
  name: string;
  barcode: string;
  categoryName: string;
  unitCode: string;
  currentStock: number;
  costPrice: number;
  sellingPrice: number;
  totalCostValue: number;
  totalRetailValue: number;
  isLowStock: boolean;
}