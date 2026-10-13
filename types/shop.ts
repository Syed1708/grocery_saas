
export interface IShop {
  id: string;
  name: string;
  phone: string;
  email?: string;
  currency: string;
  currencySymbol: string;
  village?: string;
  district?: string;
  addressLine?: string;
  receiptHeader?: string;
  receiptFooter?: string;
  ownerId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}