export interface ICashRegisterClosing {
  id: string;
  closingDate: Date | string;
  openingTime: string;
  closingTime?: string | null;
  openingCash: number;
  cashSales: number;
  cashDueCollected: number;
  cashOtherIncome: number;
  cashExpenses: number;
  cashSupplierPaid: number;
  cashRefunds: number;
  expectedCash: number;
  countedCash: number;
  difference: number;
  totalInvoices: number;
  notes?: string | null;
  status: string;
  branchId: string;
  shopId: string;
  userId?: string | null;
  user?: {
    name: string;
  } | null;
  createdAt: Date | string;
}

export interface ICurrentShiftSummary {
  lastClosingTime: Date | null;
  openingCash: number;
  cashSales: number;
  cashDueCollected: number;
  cashOtherIncome: number;
  cashExpenses: number;
  cashSupplierPaid: number;
  cashRefunds: number;
  expectedCash: number;
  totalInvoices: number;
}