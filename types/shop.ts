import { Types } from "mongoose";

export interface IShop {
  _id?: string | Types.ObjectId;
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
  ownerId?: Types.ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
}