export type AccountType = "CASH" | "BANK" | "BKASH" | "NAGAD" | "ROCKET" | "OTHER";
export type ChequeType = "RECEIVED" | "ISSUED";
export type ChequeStatus = "PENDING" | "CLEARED" | "BOUNCED" | "CANCELLED";
export type LoanType = "TAKEN" | "GIVEN";

export interface IAccount {
  id: string;
  name: string;
  type: AccountType;
  accountNumber: string | null;
  bankName: string | null;
  branchName: string | null;
  openingBalance: number;
  currentBalance: number;
  status: string;
  notes: string | null;
  shopId: string;
  createdAt: Date;
}

export interface IBankCheque {
  id: string;
  type: ChequeType;
  partyType: string;
  partyName: string;
  bankName: string;
  chequeNumber: string;
  chequeDate: Date;
  clearingDate: Date | null;
  amount: number;
  status: ChequeStatus;
  accountId: string | null;
  accountName?: string | null;
  note: string | null;
  createdAt: Date;
}

export interface ILoan {
  id: string;
  type: LoanType;
  personName: string;
  phone: string | null;
  amount: number;
  totalPaid: number;
  remainingAmount: number;
  loanDate: Date;
  dueDate: Date | null;
  status: string;
  accountName?: string | null;
  notes: string | null;
  createdAt: Date;
}