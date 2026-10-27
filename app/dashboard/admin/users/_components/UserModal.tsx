// app/(dashboard)/admin/users/_components/UserModal.tsx
"use client";

import { useState, useEffect } from "react";
import FormModal from "@/components/common/FormModal";
import { Input } from "@/components/common/ui/Input";
import { Select } from "@/components/common/ui/Select";
import { IUserItem } from "./UsersTable";
import { PERMISSIONS, UserRole } from "@/types/rbac";
import { Shield, KeyRound, Lock } from "lucide-react";

interface BranchOption {
  id: string;
  name: string;
  code: string;
}

export default function UserModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  user,
  branches,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  user?: IUserItem | null;
  branches: BranchOption[];
}) {
  const isEditing = Boolean(user);
  const [tab, setTab] = useState<"account" | "pin" | "privileges">("account");
  const [selectedRole, setSelectedRole] = useState<UserRole>(user?.role || "CASHIER");
  const [customPerms, setCustomPerms] = useState<string[]>(user?.customPermissions || []);

  // 👈 Reset tabs and state cleanly whenever the modal opens or target user changes
  useEffect(() => {
    if (isOpen) {
      setTab("account");
      setSelectedRole(user?.role || "CASHIER");
      setCustomPerms(user?.customPermissions || []);
    }
  }, [isOpen, user]);

  const togglePerm = (key: string) => {
    if (customPerms.includes(key)) {
      setCustomPerms(customPerms.filter((p) => p !== key));
    } else {
      setCustomPerms([...customPerms, key]);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title={isEditing ? `Edit Staff: ${user?.name}` : "Add New Staff Member"}
      description="Configure staff profile credentials, branch assignment, and access controls."
      loading={loading}
      isEditing={isEditing}
    >
      {user && <input type="hidden" name="id" value={user.id} />}
      <input type="hidden" name="customPermissions" value={JSON.stringify(customPerms)} />

      {/* Tab Navigation Header */}
      <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-850 rounded-lg mb-4">
        <button
          type="button"
          onClick={() => setTab("account")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
            tab === "account"
              ? "bg-white dark:bg-neutral-800 text-blue-600 shadow-xs"
              : "text-neutral-500 hover:text-neutral-900"
          }`}
        >
          <Shield size={13} /> Account & Branch
        </button>
        <button
          type="button"
          onClick={() => setTab("pin")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
            tab === "pin"
              ? "bg-white dark:bg-neutral-800 text-blue-600 shadow-xs"
              : "text-neutral-500 hover:text-neutral-900"
          }`}
        >
          <KeyRound size={13} /> Supervisor PIN
        </button>
        <button
          type="button"
          onClick={() => setTab("privileges")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
            tab === "privileges"
              ? "bg-white dark:bg-neutral-800 text-blue-600 shadow-xs"
              : "text-neutral-500 hover:text-neutral-900"
          }`}
        >
          <Lock size={13} /> Privileges ({customPerms.length})
        </button>
      </div>

      {/* Tab 1: Account & Branch */}
      <div className={`space-y-3 ${tab === "account" ? "block" : "hidden"}`}>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Full Name"
            name="name"
            required
            defaultValue={user?.name || ""}
            placeholder="e.g. John Doe"
          />
          <Input
            label="Email Address"
            name="email"
            type="email"
            required
            defaultValue={user?.email || ""}
            placeholder="john@store.com"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Phone Number"
            name="phone"
            defaultValue={user?.phone || ""}
            placeholder="+1 555 0192"
          />
          <Input
            label={isEditing ? "Password (Leave blank to keep)" : "Password *"}
            name="password"
            type="password"
            required={!isEditing}
            placeholder="••••••••"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="System Role"
            name="role"
            required
            defaultValue={user?.role || "CASHIER"}
            options={[
              { label: "CASHIER (POS Terminal)", value: "CASHIER" },
              { label: "MANAGER (Branch Lead)", value: "MANAGER" },
              { label: "OWNER (Full Access)", value: "OWNER" },
            ]}
            onChange={(e: any) => setSelectedRole(e.target.value as UserRole)}
          />

          {selectedRole === "OWNER" ? (
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Assigned Outlet / Branch
              </label>
              <div className="h-9 px-3 flex items-center text-xs text-neutral-400 bg-neutral-100 dark:bg-neutral-850 rounded-md border border-neutral-200 dark:border-neutral-800">
                All Outlets (Global Unrestricted)
              </div>
              <input type="hidden" name="branchId" value="" />
            </div>
          ) : (
            <Select
              label="Assigned Outlet / Branch"
              name="branchId"
              defaultValue={user?.branchId || branches[0]?.id || ""}
              options={branches.map((b) => ({
                label: `${b.name} [${b.code}]`,
                value: b.id,
              }))}
            />
          )}
        </div>

        {isEditing && (
          <div className="pt-2">
            <Select
              label="Account Status"
              name="isActive"
              defaultValue={user?.isActive ? "true" : "false"}
              options={[
                { label: "Active", value: "true" },
                { label: "Inactive / Suspended", value: "false" },
              ]}
            />
          </div>
        )}
      </div>

      {/* Tab 2: Supervisor PIN */}
      <div className={`space-y-3 ${tab === "pin" ? "block" : "hidden"}`}>
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg text-xs text-amber-800 dark:text-amber-300">
          A 4-digit numeric PIN allows this user to authorize discounts and returns at checkout terminals without logging out.
        </div>
        <div className="max-w-xs space-y-1">
          <Input
            label={user?.hasSupervisorPin ? "Update 4-Digit PIN (Leave blank to keep)" : "Set 4-Digit Numeric PIN"}
            name="supervisorPin"
            maxLength={4}
            placeholder="e.g. 1234"
          />
        </div>
      </div>

      {/* Tab 3: Privileges Matrix */}
      <div className={`space-y-3 ${tab === "privileges" ? "block" : "hidden"}`}>
        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-lg text-xs text-blue-800 dark:text-blue-300">
          Base permissions are inherited automatically from the selected Role. Check extra custom overrides below if needed.
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs bg-neutral-50 dark:bg-neutral-850 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 max-h-64 overflow-y-auto">
          {[
            { key: PERMISSIONS.POS_ACCESS, label: "Access POS Counter" },
            { key: PERMISSIONS.POS_DRAWER_OPEN, label: "Open Cash Drawer" },
            { key: PERMISSIONS.POS_DISCOUNT_OVERRIDE, label: "Manual Discount Override" },
            { key: PERMISSIONS.POS_REFUND_RETURN, label: "Process Refunds / Returns" },
            { key: PERMISSIONS.POS_PRICE_EDIT, label: "Modify Sale Prices" },
            { key: PERMISSIONS.CATALOG_MANAGE, label: "Manage Catalog" },
            { key: PERMISSIONS.INVENTORY_ADJUST, label: "Stock Adjustment" },
            { key: PERMISSIONS.PURCHASES_MANAGE, label: "Receive Purchases" },
            { key: PERMISSIONS.SUPPLIERS_PAY, label: "Pay Suppliers" },
            { key: PERMISSIONS.FINANCE_EXPENSES, label: "Manage OPEX Expenses" },
            { key: PERMISSIONS.REPORTS_CLOSING_Z, label: "Shift & Z-Report Closings" },
            { key: PERMISSIONS.REPORTS_PL_PROFIT, label: "View P&L Financial Reports" },
          ].map((perm) => {
            const isChecked = customPerms.includes(perm.key);
            return (
              <label key={perm.key} className="flex items-center gap-2 cursor-pointer select-none p-1">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => togglePerm(perm.key)}
                  className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-neutral-700 dark:text-neutral-300">{perm.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    </FormModal>
  );
}