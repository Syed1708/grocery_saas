export interface IUnit {
  id: string;
  name: string;
  shortCode: string;
  allowDecimal: boolean;
  baseUnitId?: string | null;
  conversionRate?: number | null;
  status: string;
  shopId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUnitOption {
  id: string;
  name: string;
  code: string;
  _count?: { products: number };
}