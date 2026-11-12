export interface IBranch {
  id: string;
  name: string;
  code: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  isMain: boolean;
  status: "active" | "inactive" | string;
  shopId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBranchWithCounts extends IBranch {
  _count: {
    users: number;
    sales: number;
  };
}

export interface IBranchOption {
  id: string;
  name: string;
  code: string;
  isMain: boolean;
}