// app/(dashboard)/admin/users/_components/UserModal.tsx
"use client";

import { useState, useEffect } from "react";
import FormModal from "@/components/common/FormModal";
import { Input } from "@/components/common/ui/Input";
import { Select } from "@/components/common/ui/Select";
import { PrivilegeMatrix } from "./PrivilegeMatrix";
import { IUserItem } from "./UsersTable";
import { DEFAULT_ROLE_PERMISSIONS, UserRole } from "@/types/rbac";
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
  
  // 👈 Stores the active set of checkboxes for this user
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTab("account");
      const initialRole = user?.role || "CASHIER";
      setSelectedRole(initialRole);
      
      // If editing and custom permissions exist, use them. Otherwise load role defaults.
      if (user?.customPermissions && user.customPermissions.length > 0) {
        setPermissions(user.customPermissions);
      } else {
        setPermissions(DEFAULT_ROLE_PERMISSIONS[initialRole] || []);
      }
    }
  }, [isOpen, user]);

  // When role changes on create/edit, reset permissions to new role's defaults
  const handleRoleChange = (newRole: UserRole) => {
    setSelectedRole(newRole);
    setPermissions(DEFAULT_ROLE_PERMISSIONS[newRole] || []);
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
      {/* 👈 Sends the exact checked permissions array to the server action */}
      <input type="hidden" name="customPermissions" value={JSON.stringify(permissions)} />

      {/* Tab Navigation Header */}
      <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-850 rounded-lg mb-4">
        <button
          type="button"
          onClick={() => setTab("account")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
            tab === "account" ? "bg-white dark:bg-neutral-800 text-blue-600 shadow-xs" : "text-neutral-500 hover:text-neutral-900"
          }`}
        >
          <Shield size={13} /> Account & Branch
        </button>
        <button
          type="button"
          onClick={() => setTab("pin")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
            tab === "pin" ? "bg-white dark:bg-neutral-800 text-blue-600 shadow-xs" : "text-neutral-500 hover:text-neutral-900"
          }`}
        >
          <KeyRound size={13} /> Supervisor PIN
        </button>
        <button
          type="button"
          onClick={() => setTab("privileges")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
            tab === "privileges" ? "bg-white dark:bg-neutral-800 text-blue-600 shadow-xs" : "text-neutral-500 hover:text-neutral-900"
          }`}
        >
          <Lock size={13} /> Privileges ({permissions.length})
        </button>
      </div>

      {/* Tab 1: Account & Branch */}
      <div className={`space-y-3 ${tab === "account" ? "block" : "hidden"}`}>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Full Name" name="name" required defaultValue={user?.name || ""} placeholder="e.g. John Doe" />
          <Input label="Email Address" name="email" type="email" required defaultValue={user?.email || ""} placeholder="john@store.com" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Phone Number" name="phone" defaultValue={user?.phone || ""} placeholder="+1 555 0192" />
          <Input label={isEditing ? "Password (Leave blank to keep)" : "Password *"} name="password" type="password" required={!isEditing} placeholder="••••••••" />
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
            onChange={(e: any) => handleRoleChange(e.target.value as UserRole)}
          />

          {selectedRole === "OWNER" ? (
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Assigned Outlet / Branch</label>
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
              options={branches.map((b) => ({ label: `${b.name} [${b.code}]`, value: b.id }))}
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
          <Input label={user?.hasSupervisorPin ? "Update 4-Digit PIN (Leave blank to keep)" : "Set 4-Digit Numeric PIN"} name="supervisorPin" maxLength={4} placeholder="e.g. 1234" />
        </div>
      </div>

      {/* Tab 3: Privileges Matrix */}
      <div className={`space-y-3 ${tab === "privileges" ? "block" : "hidden"}`}>
        <PrivilegeMatrix
          selectedRole={selectedRole}
          permissions={permissions}
          onChange={setPermissions}
        />
      </div>
    </FormModal>
  );
}