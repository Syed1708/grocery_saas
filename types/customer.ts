export type CustomerType = "WALK_IN" | "PERMANENT";

export interface ICustomer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  type: CustomerType;
  village?: string | null;
  district?: string | null;
  addressLine?: string | null;
  creditLimit: number;
  openingDue?: number;
  currentDue?: number;
  currentBalance: number; // Matches UI
  status?: string;
  shopId: string;

  // 👈 ADD THESE 3 FIELDS:
  branchId?: string | null;
  branch?: {
    id?: string;
    name: string;
    code?: string;
  } | null;
  branchName?: string | null;

  createdAt: Date;
  updatedAt?: Date;
}