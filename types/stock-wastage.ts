export type WastageReason =
  | "ROTTEN_PERISHABLE"
  | "BROKEN_DAMAGED"
  | "EXPIRED_NO_RETURN"
  | "PEST_DAMAGE"
  | "INTERNAL_STORE_USE"
  | "OTHER";

export interface IStockWastageItem {
  id?: string;
  productId: string;
  productName: string;
  barcode?: string | null;
  unitCode?: string;
  quantity: number;
  unitCost: number;
  lineCost: number;
  reason: WastageReason;
}

export interface IStockWastage {
  id: string;
  wastageNo: string;
  date: Date | string;
  totalQuantity: number;
  totalCost: number;
  reason: WastageReason;
  notes?: string | null;
  branchId: string;
  branchName: string;
  items: IStockWastageItem[];
  createdAt: Date | string;
}

export interface CreateWastagePayload {
  date?: Date | string;
  reason: WastageReason;
  notes?: string;
  items: {
    productId: string;
    quantity: number;
    unitCost: number;
    reason: WastageReason;
  }[];
}