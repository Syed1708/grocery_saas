export interface IExpenseCategoryStat {
  categoryId: string;
  categoryName: string;
  categoryCode: string;
  totalAmount: number;
  percentage: number;
  vouchersCount: number;
}

export interface IExpenseReportKPIs {
  totalExpenseAmount: number;
  cashExpenseAmount: number;
  bankExpenseAmount: number;
  otherMethodExpenseAmount: number;
  totalVouchersCount: number;
}

export interface IExpenseReportRow {
  id: string;
  voucherNo: string;
  expenseDate: Date | string;
  amount: number;
  paymentMethod: string;
  reference?: string | null;
  note?: string | null;
  receiptImage?: string | null;
  categoryId: string;
  categoryName: string;
  categoryCode: string;
  spentBy?: string | null;
}

export interface IExpenseFilterParams {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  paymentMethod?: string;
  search?: string;
}