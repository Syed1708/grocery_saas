export type CustomerType = "WALK_IN" | "PERMANENT";

export interface ICustomer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  type: CustomerType;
  village: string | null;
  district: string | null;
  addressLine: string | null;
  creditLimit: number;
  currentBalance: number;
  shopId: string;
  createdAt: Date;
  updatedAt: Date;
}