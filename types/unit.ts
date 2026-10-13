export interface IUnit {
  id: string;
  name: string;
  code: string;
  shopId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUnitOption {
  id: string;
  name: string;
  code: string;
  _count: { products: number };
}