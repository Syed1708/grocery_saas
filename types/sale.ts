// ==========================================
// 1. POS CATALOG & CART TYPES
// ==========================================

export interface IPosProduct {
  id: string;
  name: string;
  nameEn?: string | null;
  barcode: string;
  sku: string;
  unitPrice: number;
  unitId: string;
  unitCode: string;
  categoryId: string;
  categoryName?: string;
  stockAvailable: number;
  alertQuantity?: number;
  vatPercent?: number;
}

export interface ISaleCartItem extends IPosProduct {
  quantity: number;
  lineTotal: number;
}

export interface IPosCustomer {
  id: string;
  name: string;
  phone: string | null;
  currentDue: number;
  creditLimit: number;
  type: string;
}

export interface IPosCategory {
  id: string;
  name: string;
  slug?: string;
}

export interface IPosShopConfig {
  name: string;
  phone: string;
  address: string | null;
  currencySymbol: string;
  enableVat: boolean;
  vatPercent: number;
  thermalWidth: string;
  invoiceHeader: string | null;
  invoiceFooter: string | null;
}

// ==========================================
// 2. CHECKOUT PAYLOAD CONTRACTS
// ==========================================

export interface CheckoutItemPayload {
  productId: string;
  quantity: number;
  unitPrice: number;
  unitId?: string;
}

export interface CheckoutPayload {
  customerId?: string | null;
  items: CheckoutItemPayload[];
  discount: number;
  vatPercent?: number;
  cashPaid: number;
  bkashPaid: number;
  bankPaid: number;
}

export interface ISplitPaymentDetails {
  cash?: number;
  bkash?: number;
  bank?: number;
}

export interface ICompletedSale {
  invoiceNo: string;
  date: Date;
  items: ISaleCartItem[];
  subtotal: number;
  discount: number;
  vatAmount: number;
  grandTotal: number;
  paidAmount: number;
  changeAmount: number;
  dueAmount: number;
  splitPayments?: ISplitPaymentDetails; // 👈 Add this line

  customer: IPosCustomer | null;
  cashierName: string;
  branchName: string;
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
  splitPayments?: ISplitPaymentDetails; // 👈 Add this line
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
  customerId?: string | null; // 👈 ADD THIS LINE
  customerName: string;
  customerType?: string;      // 👈 "WALK_IN" | "PERMANENT"
  customerDue?: number;       // 👈 Current active Khata debt
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  items: IReturnableSaleItem[];
}

export interface ICompletedReturnItem {
  productName: string;
  quantity: number;
  unitCode: string;
  refundPrice: number;
  lineTotal: number;
  condition: "RESTOCK" | "DAMAGED";
}

export interface ICompletedReturn {
  id?: string;
  returnNo: string;
  invoiceNo: string;
  returnDate: Date | string;
  customerName: string;
  totalRefund: number;
  refundMethod: string;
  branchName: string;
  cashierName: string;
  notes?: string | null;
  items: ICompletedReturnItem[];
}