"use client";
"use no memo";

import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Edit2, Trash2 } from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";
import { IAccount } from "@/types";

export default function AccountsTab({
  accounts,
  currencySymbol,
  onEdit,
  onDelete,
}: {
  accounts: IAccount[];
  currencySymbol: string;
  onEdit: (a: IAccount) => void;
  onDelete: (a: IAccount) => void;
}) {
  const columns: ColumnDef<IAccount>[] = [
    {
      accessorKey: "name",
      header: "Account / Wallet Name",
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">
            {row.getValue("name")}
          </span>
          <span className="text-[11px] text-neutral-400 uppercase font-mono">
            {row.original.type} {row.original.bankName ? `• ${row.original.bankName}` : ""}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "accountNumber",
      header: "Account / Number",
      cell: ({ row }) => <span className="font-mono text-xs">{row.getValue("accountNumber") || "—"}</span>,
    },
    {
      accessorKey: "currentBalance",
      header: "Current Balance",
      cell: ({ row }) => (
        <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono text-sm">
          {currencySymbol}{Number(row.getValue("currentBalance")).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded uppercase bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          {row.getValue("status")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const acc = row.original;
        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onEdit(acc)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="Edit Account"
            >
              <Edit2 size={15} />
            </button>
            <button
              onClick={() => onDelete(acc)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="Delete Account"
            >
              <Trash2 size={15} />
            </button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({ data: accounts, columns, getCoreRowModel: getCoreRowModel() });
  return <DataTable table={table} columns={columns} />;
}