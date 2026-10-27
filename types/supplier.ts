export interface ISupplier {
  id: string;
  name: string;
  companyName?: string | null;
  phone: string;
  email?: string | null;
  village?: string | null;
  district?: string | null;
  address?: string | null;
  contactPerson?: string | null;
  openingDue: number;
  currentDue: number;
  status: string;
  shopId: string;

  // 👈 Add these fields:
  branchId?: string | null;
  branch?: {
    id?: string;
    name: string;
    code?: string;
  } | null;
  branchName?: string | null;

  createdAt: Date;
}