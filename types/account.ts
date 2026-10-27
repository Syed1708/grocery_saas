export interface IAccount {
  id: string;
  name: string;
  type: "CASH" | "BANK" | "BKASH" | "NAGAD" | "ROCKET" | "OTHER";
  accountNumber?: string | null;
  bankName?: string | null;
  branchName?: string | null;       // Bank's branch (e.g. Motijheel Branch)
  openingBalance: number;
  currentBalance: number;
  status: string;
  notes?: string | null;
  shopId: string;
  branchId: string;                 // 👈 ERP Store Branch ID
  storeBranchName?: string | null;  // 👈 ERP Store Branch Name
  createdAt: Date;
}

export interface IBankCheque {
  id: string;
  type: "RECEIVED" | "ISSUED";
  partyType: "CUSTOMER" | "SUPPLIER" | "OTHER";
  partyName: string;
  bankName: string;
  chequeNumber: string;
  chequeDate: Date;
  clearingDate?: Date | null;
  amount: number;
  status: "PENDING" | "CLEARED" | "BOUNCED" | "CANCELLED";
  accountId?: string | null;
  accountName?: string | null;
  note?: string | null;
  branchId: string;                 // 👈 ERP Store Branch ID
  storeBranchName?: string | null;
  createdAt: Date;
}

export interface ILoan {
  id: string;
  type: "TAKEN" | "GIVEN";
  personName: string;
  phone?: string | null;
  amount: number;
  totalPaid: number;
  remainingAmount: number;
  loanDate: Date;
  dueDate?: Date | null;
  status: "ACTIVE" | "PAID";
  accountName?: string | null;
  notes?: string | null;
  branchId: string;                 // 👈 ERP Store Branch ID
  storeBranchName?: string | null;
  createdAt: Date;
}