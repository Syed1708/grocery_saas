import { Types } from "mongoose";

export interface ICategory {
  _id?: string | Types.ObjectId;
  name: string;
  description?: string;
  image?: string;
  shopId: Types.ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
}