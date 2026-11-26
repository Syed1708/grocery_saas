export type PartnerRelationship = "FATHER" | "UNCLE" | "BROTHER" | "SELF" | "OTHER";

export type PartnerTransactionType = 
  | "CASH_DRAWING" 
  | "BANK_DRAWING" 
  | "CAPITAL_INJECTION" 
  | "HOUSEHOLD_EXPENSE" 
  | "PROFIT_DISTRIBUTION";

export interface IPartner {
  id: string;
  name: string;
  relationship: PartnerRelationship;
  phone: string | null;
  nidNumber: string | null;
  equityPercent: number;
  openingCapital: number;
  currentBalance: number;
  monthlyAllowance: number;
  status: string;
  notes: string | null;
  totalDrawings?: number;
  totalRations?: number;
  totalInjections?: number;
  createdAt: Date;
}

export interface IPartnerTransaction {
  id: string;
  voucherNo: string;
  type: PartnerTransactionType;
  amount: number;
  transactionDate: Date;
  paymentMethod: string;
  purpose: string | null;
  notes: string | null;
  partnerId: string;
  partnerName?: string;
  accountId: string | null;
  accountName?: string | null;
  branchId: string;
}

export interface IPartnerRationItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
  unitName?: string;
}

export interface IPartnerRation {
  id: string;
  rationNo: string;
  rationDate: Date;
  totalCost: number;
  notes: string | null;
  partnerId: string;
  partnerName?: string;
  items: IPartnerRationItem[];
}

export interface IFamilyReportFilters {
  startDate?: string;
  endDate?: string;
  partnerId?: string;
  statementType?: "all" | "drawings" | "rations";
}

export interface IFamilyLedgerFilters {
  startDate?: string;
  endDate?: string;
  partnerId?: string;
  type?: PartnerTransactionType;
}

export interface IFamilyReportKpis {
  openingCapital: number;
  injections: number;
  drawings: number;
  rations: number;
  netEquity: number;
}

export interface IFamilyReportPartnerRow {
  id: string;
  name: string;
  relationship: PartnerRelationship;
  equityPercent: number;
  openingCapital: number;
  injections: number;
  drawings: number;
  rations: number;
  netEquity: number;
}

export interface IFamilyReportData {
  kpis: IFamilyReportKpis;
  partners: IFamilyReportPartnerRow[];
  transactions: IPartnerTransaction[];
  rations: IPartnerRation[];
}