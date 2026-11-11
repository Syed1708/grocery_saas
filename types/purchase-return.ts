export type ReturnSettlementType = "DUE_DEDUCTION" | "CASH_REFUND" | "PARTIAL";

export type ReturnReason =
  | "EXPIRED"
  | "DAMAGED"
  | "WRONG_ITEM"
  | "POOR_QUALITY"
  | "OTHER";

export interface IPurchaseReturnItem {
  id?: string;
  productId: string;
  productName: string;
  barcode?: string | null;
  quantity: number;
  unitCost: number;
  lineTotal: number;
  reason: ReturnReason;
  notes?: string;
}

export interface IPurchaseReturn {
  id: string;
  returnNo: string;
  returnDate: Date;
  totalQuantity: number;
  totalAmount: number;
  refundAmount: number;
  dueDeduction: number;
  settlementType: ReturnSettlementType;
  paymentMethod: string | null;
  notes: string | null;
  branchId: string;
  branchName: string;
  supplierId: string;
  supplierName: string;
  supplierCompany: string;
  supplierPhone: string | null;
  purchaseId?: string | null;
  purchaseChalanNo?: string | null;
  items: IPurchaseReturnItem[];
  createdAt: Date;
}

export interface CreatePurchaseReturnPayload {
  supplierId: string;
  purchaseId?: string | null;
  returnDate?: Date | string;
  settlementType: ReturnSettlementType;
  paymentMethod?: string;
  refundAmount?: number;
  notes?: string;
  items: {
    productId: string;
    productName?: string;
    quantity: number;
    unitCost: number;
    reason: ReturnReason;
    notes?: string;
  }[];
}