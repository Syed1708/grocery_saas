export interface IExpenseCategory {
  id: string;
  name: string;
  code: string;
  description: string | null;
  status: string;
  _count?: { expenses: number };
}

export interface IExpense {
  id: string;
  voucherNo: string;
  expenseDate: Date;
  amount: number;
  paymentMethod: string;
  reference: string | null;
  note: string | null;
  categoryName: string;
  branchName: string;
  createdAt: Date;
}

export interface IOtherIncome {
  id: string;
  incomeSource: string;
  receiptNo: string;
  incomeDate: Date;
  amount: number;
  paymentMethod: string;
  reference: string | null;
  note: string | null;
  createdAt: Date;
}

export interface ICompanyAsset {
  id: string;
  name: string;
  assetCode: string;
  serialNumber: string | null;
  purchaseDate: Date;
  purchaseCost: number;
  currentValue: number;
  condition: "GOOD" | "MAINTENANCE" | "DAMAGED" | "DISPOSED";
  notes: string | null;
  branchName?: string | null;
}

export interface IOwnerTransaction {
  id: string;
  type: "CAPITAL" | "DRAWING";
  transactionDate: Date;
  amount: number;
  paymentMethod: string;
  reference: string | null;
  purpose: string | null;
  notes: string | null;
  createdAt: Date;
}