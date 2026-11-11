// ==========================================
// PAYMENT ENUMS & INTERFACES
// ==========================================
export type PaymentMethod =
  | "CASH"
  | "BANK_TRANSFER"
  | "CHEQUE"
  | "BKASH"
  | "NAGAD"
  | "ROCKET"
  | "CARD";

export type PaymentStatus = "PAID" | "PARTIAL" | "DUE";
export type PurchasePaymentStatusType = PaymentStatus; // Backward-compatibility alias

export interface IPurchasePayment {
  id?: string;
  amount: number;
  method: PaymentMethod;
  trxId?: string | null;
  bankName?: string | null;
  chequeNo?: string | null;
  chequeDate?: Date | null;
  chequeStatus?: "PENDING" | "CLEARED" | "BOUNCED" | null;
}

// ==========================================
// ITEM INTERFACES (INPUT & READ)
// ==========================================
export interface PurchaseItemInput {
  productId: string;
  quantity: number; // Net received good stock
  billedQuantity?: number; // Quantity written on paper memo
  damagedQuantity?: number; // Damaged / broken at delivery gate
  missingQuantity?: number; // Short / missing in delivery
  unitCost: number;
  commission?: number;
}

export interface IPurchaseItem {
  id?: string;
  productId: string;
  productName: string;
  barcode?: string | null;
  unitCode?: string;
  quantity: number; // Net received good stock
  billedQuantity?: number;
  damagedQuantity?: number;
  missingQuantity?: number;
  unitCost: number;
  commission?: number;
  lineTotal: number;
}

export type IPurchaseItemDetail = IPurchaseItem; // Backward-compatibility alias

// ==========================================
// MASTER PURCHASE INVOICE INTERFACE
// ==========================================
export interface IPurchase {
  id: string;
  chalanNo: string;
  chalanImageUrl?: string | null;
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
  paymentStatus: PaymentStatus;
  notes?: string | null;
  branchId?: string;
  branchName?: string;
  supplierId: string;
  supplierName: string;
  supplierCompany?: string;
  supplierPhone?: string | number | null;
  items: IPurchaseItem[];
  createdAt: Date | string;
}

// ==========================================
// ACTION PAYLOADS
// ==========================================
export interface CreatePurchasePayload {
  supplierId: string;
  chalanNo: string;
  chalanImageUrl?: string | null;
  fromPOId?: string | null; // 👈 ADD THIS: links to original PO
  purchaseDate?: Date | string;
  paymentMethod?: string;
  paidAmount?: number;
  discount?: number;
  transportCost?: number;
  vatPercent?: number;
  notes?: string;
  items: PurchaseItemInput[];
}

export interface UpdatePurchasePayload extends CreatePurchasePayload {
  id: string;
}

// ==========================================
// REPORT & FILTER PARAMS
// ==========================================
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