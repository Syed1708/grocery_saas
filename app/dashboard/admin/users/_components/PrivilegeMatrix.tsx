// app/(dashboard)/admin/users/_components/privilege-matrix.tsx
"use client";

import { PERMISSIONS, DEFAULT_ROLE_PERMISSIONS, PermissionKey, UserRole } from "@/types/rbac";
import { Check, ShieldCheck } from "lucide-react";

interface PrivilegeMatrixProps {
  selectedRole: UserRole;
  permissions: string[];
  onChange: (permissions: string[]) => void;
}

interface PermissionGroup {
  category: string;
  items: { key: PermissionKey; label: string; desc: string }[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    category: "🛒 Point of Sale & Counter",
    items: [
      { key: PERMISSIONS.POS_ACCESS, label: "Access POS Counter", desc: "Open terminal & scan items" },
      { key: PERMISSIONS.POS_DRAWER_OPEN, label: "Open Cash Drawer", desc: "Manual drawer kick" },
      { key: PERMISSIONS.POS_DISCOUNT_OVERRIDE, label: "Manual Discount", desc: "Apply line-item discounts" },
      { key: PERMISSIONS.POS_REFUND_RETURN, label: "Process Returns", desc: "Issue sales refund vouchers" },
      { key: PERMISSIONS.POS_PRICE_EDIT, label: "Modify Sale Prices", desc: "Change product price at counter" },
    ],
  },
  {
    category: "📦 Catalog & Inventory",
    items: [
      { key: PERMISSIONS.CATALOG_VIEW, label: "View Products & Barcodes", desc: "Browse items & prices" },
      { key: PERMISSIONS.CATALOG_MANAGE, label: "Manage Catalog", desc: "Create & edit items/categories" },
      { key: PERMISSIONS.INVENTORY_ADJUST, label: "Stock Adjustment", desc: "Stock in/out correction" },
      { key: PERMISSIONS.INVENTORY_VALUATION_VIEW, label: "View Valuation", desc: "See cost prices & assets" },
    ],
  },
  {
    category: "🚚 Purchases & Suppliers",
    items: [
      { key: PERMISSIONS.PURCHASES_VIEW, label: "View Purchases", desc: "Inspect supplier chalans" },
      { key: PERMISSIONS.PURCHASES_MANAGE, label: "Receive Purchases", desc: "Record new supplier stock" },
      { key: PERMISSIONS.SUPPLIERS_PAY, label: "Pay Suppliers", desc: "Disburse vendor balances" },
    ],
  },
  {
    category: "💰 Finance, Banking & Loans",
    items: [
      { key: PERMISSIONS.FINANCE_EXPENSES, label: "Manage OPEX", desc: "Record branch operating expenses" },
      { key: PERMISSIONS.FINANCE_BANKING, label: "Banking Accounts", desc: "Manage bank accounts & transfers" },
      { key: PERMISSIONS.FINANCE_LOANS, label: "Loans & Hawlat", desc: "Track taken/given loans & installments" },
    ],
  },
  {
    category: "👥 Staff & Payroll",
    items: [
      { key: PERMISSIONS.STAFF_PAYROLL, label: "Staff & Payroll", desc: "Manage salaries & salary advances" },
    ],
  },
  {
    category: "📊 Reports & Analytics",
    items: [
      { key: PERMISSIONS.REPORTS_CLOSING_Z, label: "Shift & Z-Report", desc: "Print counter day-end slip" },
      { key: PERMISSIONS.REPORTS_SALES, label: "Sales Reports", desc: "Detailed sales volume breakdown" },
      { key: PERMISSIONS.REPORTS_PL_PROFIT, label: "P&L Financial Reports", desc: "Net profit & margins" },
      { key: PERMISSIONS.REPORTS_EXPORT, label: "Export PDF/CSV", desc: "Download master registers" },
    ],
  },
  {
    category: "⚙️ Administration & Settings",
    items: [
      { key: PERMISSIONS.SETTINGS_STORE, label: "Store Settings", desc: "Outlet profiles & VAT config" },
      { key: PERMISSIONS.USERS_MANAGE, label: "Users & RBAC", desc: "Manage staff accounts & permissions" },
      { key: PERMISSIONS.BRANCH_SWITCH, label: "Branch Switcher", desc: "Switch active outlet context" },
    ],
  },
];

export function PrivilegeMatrix({
  selectedRole,
  permissions,
  onChange,
}: PrivilegeMatrixProps) {
  const isOwner = selectedRole === "OWNER";
  const allKeys = PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => i.key));

  function togglePermission(key: PermissionKey) {
    if (isOwner) return;

    if (permissions.includes(key)) {
      onChange(permissions.filter((p) => p !== key));
    } else {
      onChange([...permissions, key]);
    }
  }

  function handleSelectAll() {
    onChange([...allKeys]);
  }

  function handleClearAll() {
    onChange([]);
  }

  function handleResetToDefaults() {
    onChange(DEFAULT_ROLE_PERMISSIONS[selectedRole] || []);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-neutral-50 dark:bg-neutral-850 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs">
        <span className="text-neutral-500">
          Fully customizable permission checkboxes (Add or Reduce freely)
        </span>
        {!isOwner && (
          <div className="flex items-center gap-2 font-semibold">
            <button type="button" onClick={handleResetToDefaults} className="text-blue-600 hover:underline cursor-pointer">
              Reset Role Defaults
            </button>
            <span>|</span>
            <button type="button" onClick={handleSelectAll} className="text-neutral-700 dark:text-neutral-300 hover:underline cursor-pointer">
              Select All
            </button>
            <span>|</span>
            <button type="button" onClick={handleClearAll} className="text-red-600 hover:underline cursor-pointer">
              Clear All
            </button>
          </div>
        )}
      </div>

      {isOwner && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-700 dark:text-blue-300">
          <ShieldCheck size={16} className="shrink-0" />
          <span>Store Owners have unrestricted global access.</span>
        </div>
      )}

      <div className="space-y-4 max-h-90 overflow-y-auto pr-1">
        {PERMISSION_GROUPS.map((group) => (
          <div key={group.category} className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              {group.category}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {group.items.map((item) => {
                const isGranted = isOwner || permissions.includes(item.key);

                return (
                  <div
                    key={item.key}
                    onClick={() => togglePermission(item.key)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition select-none cursor-pointer ${
                      isGranted
                        ? "bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800"
                        : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300"
                    }`}
                  >
                    <div
                      className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 transition ${
                        isGranted
                          ? "bg-blue-600 text-white"
                          : "border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                      }`}
                    >
                      {isGranted && <Check size={11} strokeWidth={3} />}
                    </div>

                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">
                        {item.label}
                      </span>
                      <p className="text-[11px] text-neutral-400 truncate">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}