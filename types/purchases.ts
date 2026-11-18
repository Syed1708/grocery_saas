import type { PaymentStatus } from "./purchase";

// Re-export the purchase primitives so report modules can import
// everything purchase-related from a single "@/types/purchases" entry.
export type {
  IPurchaseItem,
  IPurchaseItemDetail,
  IPurchaseReportKPIs,
  IPurchaseFilterParams,
} from "./purchase";

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
  paymentStatus: PaymentStatus;
  itemCount: number;
}
