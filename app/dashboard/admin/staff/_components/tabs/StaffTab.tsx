"use client";
"use no memo";
import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Edit2, Trash2 } from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";
import { IStaff } from "@/types";

export default function StaffTab({ staff, onEdit, onDelete }: { staff: IStaff[]; onEdit: (s: IStaff) => void; onDelete: (s: IStaff) => void }) {
  const columns: ColumnDef<IStaff>[] = [
    {
      accessorKey: "name",
      header: "Employee Name",
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">{row.getValue("name")}</span>
          <span className="text-[11px] text-neutral-400 font-mono">{row.original.designation} • {row.original.departmentName}</span>
        </div>
      ),
    },
    { accessorKey: "phone", header: "Phone", cell: ({ row }) => <span className="font-mono text-xs">{row.getValue("phone")}</span> },
    { accessorKey: "basicSalary", header: "Basic Salary", cell: ({ row }) => <span className="font-black text-emerald-600 font-mono text-xs">৳{Number(row.getValue("basicSalary")).toFixed(2)}</span> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <span className="text-[10px] font-bold px-1.5 py-0.2 rounded uppercase bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">{row.getValue("status")}</span> },
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
  const table = useReactTable({ data: staff, columns, getCoreRowModel: getCoreRowModel() });
  return <DataTable table={table} columns={columns} />;
}