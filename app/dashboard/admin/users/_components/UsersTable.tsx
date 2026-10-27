// app/(dashboard)/admin/users/_components/UsersTable.tsx
"use client";
"use no memo";

import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Edit2, Trash2, KeyRound } from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";
import { Switch } from "@/components/common/ui/Switch";
import { DEFAULT_ROLE_PERMISSIONS, UserRole } from "@/types/rbac";

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

interface UsersTableProps {
  users: IUserItem[];
  onEdit: (u: IUserItem) => void;
  onDelete: (id: string) => void; // 👈 Required prop definition
  onToggleStatus: (id: string, current: boolean) => void;
}

export default function UsersTable({
  users,
  onEdit,
  onDelete,
  onToggleStatus,
}: UsersTableProps) {
  const columns: ColumnDef<IUserItem>[] = [
    {
      accessorKey: "name",
      header: "Staff Member",
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">
            {row.getValue("name")}
          </span>
          <span className="text-[11px] text-neutral-400">{row.original.email}</span>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as string;
        const colors: Record<string, string> = {
          MANAGER: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
          CASHIER: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
        };
        return (
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${colors[role] || ""}`}>
            {role}
          </span>
        );
      },
    },
    {
      id: "permissions",
      header: "Permissions Profile",
      cell: ({ row }) => {
        const user = row.original;
        const baseCount =
          DEFAULT_ROLE_PERMISSIONS[user.role as keyof typeof DEFAULT_ROLE_PERMISSIONS]?.length || 0;
        const customCount = user.customPermissions?.length || 0;

        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
              {baseCount} Role Permissions
            </span>
            {customCount > 0 ? (
              <span className="inline-flex items-center w-max px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
                +{customCount} Custom Overrides
              </span>
            ) : (
              <span className="text-[10px] text-neutral-400">Standard Defaults</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "branchName",
      header: "Assigned Outlet",
      cell: ({ row }) => <span className="text-xs">{row.getValue("branchName")}</span>,
    },
    {
      accessorKey: "hasSupervisorPin",
      header: "POS PIN",
      cell: ({ row }) => (
        <span className="text-xs">
          {row.original.hasSupervisorPin ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">
              <KeyRound size={10} /> Active
            </span>
          ) : (
            <span className="text-neutral-400 text-[11px]">None</span>
          )}
        </span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <Switch
            checked={user.isActive}
            onCheckedChange={() => onToggleStatus(user.id, user.isActive)}
          />
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(user)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="Edit Staff & Permissions"
            >
              <Edit2 size={15} />
            </button>
            <button
              onClick={() => onDelete(user.id)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="Delete Staff Member"
            >
              <Trash2 size={15} />
            </button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({ data: users, columns, getCoreRowModel: getCoreRowModel() });
  return <DataTable table={table} columns={columns} />;
}