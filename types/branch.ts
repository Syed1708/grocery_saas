export interface IBranch {
  id: string;
  name: string;
  code: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  isMain: boolean;
  status: string;
  shopId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBranchOption {
  id: string;
  name: string;
  code: string;
  isMain: boolean;
}