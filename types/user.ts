export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "OWNER"
  | "MANAGER"
  | "CASHIER"
  | "VENDOR";

export interface IUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  profileImage?: string | null;
  isActive: boolean;
  branchId?: string | null;
  branchName?: string | null;
  shopId: string;
  createdAt: Date;
  updatedAt: Date;
}