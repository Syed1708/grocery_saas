// types/rbac.ts

export type UserRole = "OWNER" | "MANAGER" | "CASHIER";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "INACTIVE";

/**
 * Granular Permission Matrix Catalog
 */
export const PERMISSIONS = {
  // POS & Counter
  POS_ACCESS: "pos.access",
  POS_DISCOUNT_OVERRIDE: "pos.discount_override",
  POS_PRICE_EDIT: "pos.price_edit",
  POS_REFUND_RETURN: "pos.refund_return",
  POS_DRAWER_OPEN: "pos.drawer_open",

  // Inventory & Catalog
  CATALOG_VIEW: "catalog.view",
  CATALOG_MANAGE: "catalog.manage",
  INVENTORY_ADJUST: "inventory.adjust",
  INVENTORY_VALUATION_VIEW: "inventory.valuation_view",

  // Purchases & Suppliers
  PURCHASES_VIEW: "purchases.view",
  PURCHASES_MANAGE: "purchases.manage",
  SUPPLIERS_PAY: "suppliers.pay",

  // Finance & Banking
  FINANCE_EXPENSES: "finance.expenses",
  FINANCE_BANKING: "finance.banking",
  FINANCE_LOANS: "finance.loans",

  // Reports
  REPORTS_SALES: "reports.sales",
  REPORTS_CLOSING_Z: "reports.closing_z",
  REPORTS_PL_PROFIT: "reports.pl_profit",
  REPORTS_EXPORT: "reports.export",

  // Administration
  STAFF_PAYROLL: "staff.payroll",
  SETTINGS_STORE: "settings.store",
  USERS_MANAGE: "users.manage",
  BRANCH_SWITCH: "branch.switch",
} as const;

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * Default Baseline Permissions mapped to each Role
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  OWNER: Object.values(PERMISSIONS),
  
  MANAGER: [
    PERMISSIONS.POS_ACCESS,
    PERMISSIONS.POS_DISCOUNT_OVERRIDE,
    PERMISSIONS.POS_PRICE_EDIT,
    PERMISSIONS.POS_REFUND_RETURN,
    PERMISSIONS.POS_DRAWER_OPEN,
    PERMISSIONS.CATALOG_VIEW,
    PERMISSIONS.CATALOG_MANAGE,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.PURCHASES_VIEW,
    PERMISSIONS.PURCHASES_MANAGE,
    PERMISSIONS.SUPPLIERS_PAY,
    PERMISSIONS.FINANCE_EXPENSES,
    PERMISSIONS.REPORTS_SALES,
    PERMISSIONS.REPORTS_CLOSING_Z,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.STAFF_PAYROLL,
  ],

  CASHIER: [
    PERMISSIONS.POS_ACCESS,
    PERMISSIONS.POS_DRAWER_OPEN,
    PERMISSIONS.REPORTS_CLOSING_Z,
  ],
};

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  branchId: string | null;
  branchName: string | null;
  hasCustomPermissions: boolean;
  hasSupervisorPin: boolean;
  shopId: string;
  createdAt: Date;
}