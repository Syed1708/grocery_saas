"use client";
"use no memo";
import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Edit2, Trash2 } from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";
import { IOtherIncome } from "@/types";

export default function IncomesTab({ incomes, currencySymbol, onEdit, onDelete }: { incomes: IOtherIncome[]; currencySymbol: string; onEdit: (i: IOtherIncome) => void; onDelete: (i: IOtherIncome) => void }) {
  const columns: ColumnDef<IOtherIncome>[] = [
    { accessorKey: "receiptNo", header: "Receipt #", cell: ({ row }) => <span className="font-mono font-bold">#{row.getValue("receiptNo")}</span> },
    { accessorKey: "incomeSource", header: "Income Source", cell: ({ row }) => <span className="font-semibold">{row.getValue("incomeSource")}</span> },
    { accessorKey: "amount", header: "Amount", cell: ({ row }) => <span className="font-black text-emerald-600 font-mono">{currencySymbol}{Number(row.getValue("amount")).toFixed(2)}</span> },
    { accessorKey: "incomeDate", header: "Date", cell: ({ row }) => <span>{new Date(row.original.incomeDate).toLocaleDateString()}</span> },
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
  const table = useReactTable({ data: incomes, columns, getCoreRowModel: getCoreRowModel() });
  return <DataTable table={table} columns={columns} />;
}