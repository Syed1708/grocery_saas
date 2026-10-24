"use client";
"use no memo";
import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Edit2, Trash2 } from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";
import { IExpense } from "@/types";

export default function ExpensesTab({ expenses, currencySymbol, onEdit, onDelete }: { expenses: IExpense[]; currencySymbol: string; onEdit: (e: IExpense) => void; onDelete: (e: IExpense) => void }) {
  const columns: ColumnDef<IExpense>[] = [
    { accessorKey: "voucherNo", header: "Voucher #", cell: ({ row }) => <span className="font-mono font-bold">#{row.getValue("voucherNo")}</span> },
    { accessorKey: "categoryName", header: "Expense Category", cell: ({ row }) => <span className="font-semibold">{row.getValue("categoryName")}</span> },
    { accessorKey: "amount", header: "Amount", cell: ({ row }) => <span className="font-black text-red-600 font-mono">{currencySymbol}{Number(row.getValue("amount")).toFixed(2)}</span> },
    { accessorKey: "paymentMethod", header: "Paid Via", cell: ({ row }) => <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">{row.getValue("paymentMethod")}</span> },
    { accessorKey: "expenseDate", header: "Date", cell: ({ row }) => <span>{new Date(row.original.expenseDate).toLocaleDateString()}</span> },
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
  const table = useReactTable({ data: expenses, columns, getCoreRowModel: getCoreRowModel() });
  return <DataTable table={table} columns={columns} />;
}