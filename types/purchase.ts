export type PaymentMethod =
  | "CASH"
  | "BANK_TRANSFER"
  | "CHEQUE"
  | "BKASH"
  | "NAGAD"
  | "ROCKET"
  | "CARD";

export type PaymentStatus = "PAID" | "PARTIAL" | "DUE";

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

export interface IPurchaseItem {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  commission?: number;
  lineTotal: number;
}

export interface IPurchase {
  id: string;
  chalanNo: string;
  purchaseDate: Date;
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
  paymentStatus: "PAID" | "PARTIAL" | "DUE";
  notes: string | null;
  supplierId: string;
  supplierName: string;
  supplierCompany: string;
  items: IPurchaseItem[];
  createdAt: Date;
}