"use client";
"use no memo";
import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Edit2, Trash2 } from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";
import { IExpenseCategory } from "@/types";

export default function ExpenseCategoriesTab({ categories, onEdit, onDelete }: { categories: IExpenseCategory[]; onEdit: (c: IExpenseCategory) => void; onDelete: (c: IExpenseCategory) => void }) {
  const columns: ColumnDef<IExpenseCategory>[] = [
    { accessorKey: "code", header: "Code", cell: ({ row }) => <span className="font-mono">{row.getValue("code")}</span> },
    { accessorKey: "name", header: "Expense Type Name", cell: ({ row }) => <span className="font-semibold">{row.getValue("name")}</span> },
    { accessorKey: "description", header: "Description", cell: ({ row }) => <span className="text-neutral-400">{row.getValue("description") || "—"}</span> },
    { accessorKey: "_count.expenses", header: "Linked Expenses", cell: ({ row }) => <span>{row.original._count?.expenses || 0} records</span> },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-1.5">
            <button onClick={() => onEdit(item)} className="p-1.5 text-neutral-500 hover:text-blue-600 rounded-lg transition cursor-pointer" title="Edit"><Edit2 size={15} /></button>
            <button onClick={() => onDelete(item)} disabled={(item._count?.expenses || 0) > 0} className="p-1.5 text-neutral-500 hover:text-red-600 disabled:opacity-30 rounded-lg transition cursor-pointer" title="Delete"><Trash2 size={15} /></button>
          </div>
        );
      },
    },
  ];
  const table = useReactTable({ data: categories, columns, getCoreRowModel: getCoreRowModel() });
  return <DataTable table={table} columns={columns} />;
}