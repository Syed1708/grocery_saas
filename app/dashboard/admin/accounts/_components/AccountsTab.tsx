"use client";
"use no memo";

import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { DataTable } from "@/components/common/data-table/DataTable";
import { IAccount } from "@/types";

export default function AccountsTab({
  accounts,
  currencySymbol,
}: {
  accounts: IAccount[];
  currencySymbol: string;
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
  ];

  const table = useReactTable({ data: accounts, columns, getCoreRowModel: getCoreRowModel() });
  return <DataTable table={table} columns={columns} />;
}