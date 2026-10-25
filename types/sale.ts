// ==========================================
// 1. POS CART & CHECKOUT TYPES
// ==========================================

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
  discount: number;
  lineTotal: number;
}

// ==========================================
// 2. SALE & SALE ITEM TYPES
// ==========================================

export interface ISaleItem {
  id: string;
  productId: string;
  productName: string;
  barcode?: string;
  unitId?: string | null;
  unitCode?: string;
  quantity: number;
  unitPrice: number;
  purchaseCost: number;
  discount: number;
  lineTotal: number;
  // Optional computed fields for return audit
  alreadyReturnedQty?: number;
  remainingQty?: number;
}

export interface ISale {
  id: string; 
  invoiceNo: string;
  saleDate: Date | string;
  subtotal: number;
  discount: number;
  vatPercent: number;
  vatAmount: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  changeAmount: number;
  paymentMethod: string;
  paymentStatus: "paid" | "partial" | "due" | string;
  offlineUuid?: string | null;
  isSynced?: boolean;
  notes?: string | null;
  branchId: string;
  branchName?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  userId?: string | null;
  cashierName?: string | null;
  items: ISaleItem[];
  returns?: ISaleReturn[];
  createdAt: Date | string;
  updatedAt?: Date | string;
}

// ==========================================
// 3. RETURN & REFUND TYPES
// ==========================================

export type ItemConditionType = "RESTOCK" | "DAMAGED";
export type RefundMethodType = "cash" | "balance";

export interface ISaleReturnItem {
  id: string;
  saleReturnId?: string;
  productId: string;
  productName: string;
  barcode?: string;
  unitId?: string | null;
  unitCode?: string;
  quantity: number;
  refundPrice: number;
  itemCondition: ItemConditionType;
  createdAt?: Date | string;
}

export interface ISaleReturn {
  id: string;
  returnNo: string;
  returnDate: Date | string;
  totalRefund: number;
  refundMethod: RefundMethodType | string;
  notes?: string | null;
  saleId: string;
  invoiceNo: string;
  customerId?: string | null;
  customerName: string;
  branchId: string;
  cashierName?: string;
  items?: ISaleReturnItem[];
  createdAt: Date | string;
}

// ==========================================
// 4. RETURN WORKFLOW CONTRACT (SEARCH MODAL)
// ==========================================

export interface IReturnableSaleItem {
  id: string;               // saleItem ID
  productId: string;
  productName: string;
  barcode: string;
  unitCode: string;
  unitPrice: number;
  totalSoldQty: number;     // Original invoice sold qty
  alreadyReturnedQty: number; // Sum of prior returns
  remainingQty: number;     // Remaining returnable threshold
}

export interface IReturnableSale {
  id: string;               // Sale ID
  invoiceNo: string;
  customerName: string;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  items: IReturnableSaleItem[];
}