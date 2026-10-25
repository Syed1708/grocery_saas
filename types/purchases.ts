export interface IPurchaseReportKPIs {
  totalPurchasesAmount: number;
  totalPaidAmount: number;
  totalDueAmount: number;
  totalDiscountAmount: number;
  totalChalansCount: number;
}

export type PurchasePaymentStatusType = "PAID" | "PARTIAL" | "DUE";

export interface IPurchaseReportRow {
  id: string;
  chalanNo: string;
  purchaseDate: Date | string;
  supplierId: string;
  supplierName: string;
  supplierPhone?: string | null;
  companyName?: string | null;
  totalQuantity: number;
  subtotal: number;
  discount: number;
  transportCost: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: string;
  paymentStatus: PurchasePaymentStatusType;
  itemCount: number;
}

export interface IPurchaseItemDetail {
  id: string;
  productId: string;
  productName: string;
  barcode: string;
  unitCode: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

export interface IPurchaseFilterParams {
  startDate?: string;
  endDate?: string;
  supplierId?: string;
  paymentStatus?: string;
  search?: string;
}