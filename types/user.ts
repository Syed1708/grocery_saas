import { Types } from "mongoose";

export type UserRole = "OWNER" | "MANAGER" | "CASHIER";

export interface IUser {
  _id?: string | Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role: UserRole;
  shopId: Types.ObjectId | string; // Allows Mongoose ObjectId and string IDs
  profileImage?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}