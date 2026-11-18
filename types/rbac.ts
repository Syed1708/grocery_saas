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
  INVENTORY_TRANSFER: "inventory.transfer",
  INVENTORY_WASTAGE: "inventory.wastage",

  // Customers & Khata
  CUSTOMERS_VIEW: "customers.view",
  CUSTOMERS_MANAGE: "customers.manage",

  // Purchases & Suppliers
  PURCHASES_VIEW: "purchases.view",
  PURCHASES_MANAGE: "purchases.manage",
  SUPPLIERS_VIEW: "suppliers.view",
  SUPPLIERS_MANAGE: "suppliers.manage",
  SUPPLIERS_PAY: "suppliers.pay",

  // Finance & Banking
  FINANCE_EXPENSES: "finance.expenses",
  FINANCE_BANKING: "finance.banking",
  FINANCE_LOANS: "finance.loans",

  // Reports
  REPORTS_OVERVIEW: "reports.overview",
  REPORTS_SALES: "reports.sales",
  REPORTS_PURCHASES: "reports.purchases",
  REPORTS_STOCK: "reports.stock",
  REPORTS_CUSTOMER_DUE: "reports.customer_due",
  REPORTS_EXPENSES: "reports.expenses",
  REPORTS_CLOSING_Z: "reports.closing_z",
  REPORTS_PL_PROFIT: "reports.pl_profit",
  REPORTS_EXPORT: "reports.export",

  // Administration
  STAFF_MANAGE: "staff.manage",
  STAFF_PAYROLL: "staff.payroll",
  SETTINGS_STORE: "settings.store",
  USERS_MANAGE: "users.manage",
  BRANCH_MANAGE: "branch.manage",
  BRANCH_SWITCH: "branch.switch",
  FAMILY_LEDGER_ACCESS: "family_ledger.access",
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
    PERMISSIONS.INVENTORY_TRANSFER,
    PERMISSIONS.INVENTORY_WASTAGE,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CUSTOMERS_MANAGE,
    PERMISSIONS.PURCHASES_VIEW,
    PERMISSIONS.PURCHASES_MANAGE,
    PERMISSIONS.SUPPLIERS_VIEW,
    PERMISSIONS.SUPPLIERS_MANAGE,
    PERMISSIONS.SUPPLIERS_PAY,
    PERMISSIONS.FINANCE_EXPENSES,
    PERMISSIONS.REPORTS_OVERVIEW,
    PERMISSIONS.REPORTS_SALES,
    PERMISSIONS.REPORTS_PURCHASES,
    PERMISSIONS.REPORTS_STOCK,
    PERMISSIONS.REPORTS_CUSTOMER_DUE,
    PERMISSIONS.REPORTS_EXPENSES,
    PERMISSIONS.REPORTS_CLOSING_Z,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.STAFF_MANAGE,
    PERMISSIONS.STAFF_PAYROLL,
  ],

  CASHIER: [
    PERMISSIONS.POS_ACCESS,
    PERMISSIONS.POS_DRAWER_OPEN,
    PERMISSIONS.REPORTS_CLOSING_Z,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CUSTOMERS_MANAGE,
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