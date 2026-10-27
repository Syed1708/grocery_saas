export interface IBranchSettings {
  id: string;
  name: string;
  code: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  isMain: boolean;
  status: string; // "active" | "inactive"
  createdAt: Date | string;
  _count?: {
    users: number;
    sales: number;
  };
}

export interface IShopSettings {
  id: string;
  name: string;
  nameEn?: string | null;
  phone: string;
  email?: string | null;
  address?: string | null;
  tradeLicense?: string | null;
  binVatNumber?: string | null;
  currencySymbol: string;
  vatPercent: number;
  enableVat: boolean;
  thermalWidth: string; // "80mm" | "58mm"
  invoiceHeader?: string | null;
  invoiceFooter?: string | null;
  banglaReceipt: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}