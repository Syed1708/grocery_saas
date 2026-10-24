"use client";
"use no memo";
import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Edit2, Trash2 } from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";
import { IOwnerTransaction } from "@/types";

export default function EquityTab({ equity, currencySymbol, onEdit, onDelete }: { equity: IOwnerTransaction[]; currencySymbol: string; onEdit: (eq: IOwnerTransaction) => void; onDelete: (eq: IOwnerTransaction) => void }) {
  const columns: ColumnDef<IOwnerTransaction>[] = [
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.original.type;
        return (
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${type === "CAPITAL" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400"}`}>
            {type === "CAPITAL" ? "Capital Injection (মূলধন)" : "Owner Drawing (ব্যক্তিগত উত্তোলন)"}
          </span>
        );
      },
    },
    { accessorKey: "purpose", header: "Purpose / Description", cell: ({ row }) => <span>{row.getValue("purpose") || "—"}</span> },
    { accessorKey: "amount", header: "Amount", cell: ({ row }) => <span className="font-black font-mono">{currencySymbol}{Number(row.getValue("amount")).toFixed(2)}</span> },
    { accessorKey: "transactionDate", header: "Date", cell: ({ row }) => <span>{new Date(row.original.transactionDate).toLocaleDateString()}</span> },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-1.5">
            <button onClick={() => onEdit(item)} className="p-1.5 text-neutral-500 hover:text-blue-600 rounded-lg transition cursor-pointer" title="Edit"><Edit2 size={15} /></button>
            <button onClick={() => onDelete(item)} className="p-1.5 text-neutral-500 hover:text-red-600 rounded-lg transition cursor-pointer" title="Delete"><Trash2 size={15} /></button>
          </div>
        );
      },
    },
  ];
  const table = useReactTable({ data: equity, columns, getCoreRowModel: getCoreRowModel() });
  return <DataTable table={table} columns={columns} />;
}