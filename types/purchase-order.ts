export type PurchaseOrderStatus = "DRAFT" | "SENT_TO_SR" | "CONVERTED" | "CANCELLED";

export interface IPurchaseOrderItem {
  id?: string;
  productId: string;
  productName: string;
  barcode?: string | null;
  unitCode?: string;
  currentStock: number;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

export interface IPurchaseOrder {
  id: string;
  orderNo: string;
  orderDate: Date | string;
  status: PurchaseOrderStatus;
  totalItems: number;
  estimatedTotal: number;
  notes?: string | null;
  supplierId: string;
  supplierName: string;
  supplierCompany?: string;
  supplierPhone?: string | null;
  branchName: string;
  items: IPurchaseOrderItem[];
  createdAt: Date | string;
}

export interface ReorderSuggestionItem {
  id: string;
  name: string;
  barcode: string;
  unitCode: string;
  currentStock: number;
  minStockAlert: number;
  unitCost: number;
  suggestedQty: number;
}