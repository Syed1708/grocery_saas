export interface ICustomerDueRow {
  id: string;
  name: string;
  phone: string | null;
  village: string | null;
  address: string | null;
  type: "WALK_IN" | "PERMANENT";
  openingDue: number;
  creditLimit: number;
  currentDue: number;
  limitUsagePercent: number;
  lastPaymentDate: Date | string | null;
  oldestUnpaidInvoiceDate: Date | string | null;
  overdueDays: number;
  totalInvoicesCount: number;
}

export interface ICustomerDueKPIs {
  totalDueAmount: number;
  totalDueCustomers: number;
  overdue30DaysAmount: number;
  creditExceededCustomersCount: number;
  averageDuePerCustomer: number;
}

export interface ICustomerKhataEntry {
  id: string;
  date: Date | string;
  type: "OPENING" | "SALE" | "PAYMENT" | "RETURN";
  title: string;
  referenceNo: string;
  invoiceTotal?: number;
  paidAtPos?: number;
  debit: number;   // Amount added to Due (+)
  credit: number;  // Amount deducted from Due (-)
  balance: number; // Accurate Running Balance
  note?: string | null;
}

export interface ICustomerKhataSummary {
  openingDue: number;
  totalBilled: number;
  totalPaid: number;
  currentDue: number;
}