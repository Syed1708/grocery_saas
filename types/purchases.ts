export interface IPurchaseReportKPIs {
  totalPurchasesAmount: number;
  totalPaidAmount: number;
  totalDueAmount: number;
  totalDiscountAmount: number;
  totalChalansCount: number;
}

export interface IPurchaseFilterParams {
  startDate?: string;
  endDate?: string;
  supplierId?: string;
  paymentStatus?: string;
  search?: string;
}

export type PurchasePaymentStatusType = "PAID" | "PARTIAL" | "DUE";

export interface IPurchaseItemDetail {
  id: string;
  productId: string;
  productName: string;
  barcode?: string;
  unitCode?: string;
  quantity: number;
  unitCost: number;
  commission: number;
  lineTotal: number;
}

export interface IPurchase {
  id: string;
  chalanNo: string;
  purchaseDate: Date | string;
  subtotal: number;
  totalQuantity: number;
  discount: number;
  transportCost: number;
  vatPercent: number;
  vatAmount: number;
  grandTotal: number;
  previousDue: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: string;
  paymentStatus: PurchasePaymentStatusType;
  notes?: string | null;
  branchId: string;
  branchName?: string;
  supplierId: string;
  supplierName: string;
  supplierCompany?: string;
  supplierPhone?: string | null;
  items: IPurchaseItemDetail[];
  createdAt: Date | string;
}

export interface PurchaseItemInput {
  productId: string;
  quantity: number;
  unitCost: number;
  commission?: number;
}

export interface CreatePurchasePayload {
  supplierId: string;
  chalanNo: string;
  paymentMethod?: string;
  paidAmount: number;
  discount?: number;
  transportCost?: number;
  vatPercent?: number;
  notes?: string;
  items: PurchaseItemInput[];
}

export interface UpdatePurchasePayload extends CreatePurchasePayload {
  id: string;
}




