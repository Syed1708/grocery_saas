import type { UserRole } from "./rbac";

export interface IUserBranchOption {
  id: string;
  name: string;
  code: string;
}

export interface IUserItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  branchId: string | null;
  branchName: string;
  hasSupervisorPin: boolean;
  customPermissions: string[];
}
