export interface ISupplier {
  id: string;
  name: string;
  companyName: string;
  phone: string;
  email: string | null;
  village?: string | null;
  district?: string | null;
  addressLine?: string | null;
  address?: string | null;
  payableBalance: number;
  shopId: string;
  createdAt: Date;
}