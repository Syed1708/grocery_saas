export interface ISaleCartItem {
  productId: string;
  name: string;
  barcode: string;
  unitId: string;
  unitCode: string;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  stockAvailable: number;
  lineTotal: number;
}

export interface ISaleItem {
  id: string;
  productId: string;
  productName: string;
  unitCode?: string;
  quantity: number;
  unitPrice: number;
  purchaseCost: number;
  discount: number;
  lineTotal: number;
}

export interface ISale {
  id: string;
  invoiceNo: string;
  saleDate: Date;
  subtotal: number;
  discount: number;
  vatPercent: number;
  vatAmount: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  changeAmount: number;
  paymentMethod: string;
  paymentStatus: "paid" | "partial" | "due";
  offlineUuid?: string | null;
  notes?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  cashierName?: string | null;
  branchName?: string | null;
  items: ISaleItem[];
  createdAt: Date;
}
export interface ISaleReturn {
  id: string;
  returnNo: string;
  returnDate: Date;
  totalRefund: number;
  refundMethod: string;
  notes?: string | null;
  invoiceNo: string;
  customerName: string;
  createdAt: Date;
}