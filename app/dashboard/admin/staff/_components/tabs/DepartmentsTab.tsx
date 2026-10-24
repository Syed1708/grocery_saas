"use client";
"use no memo";
import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Edit2, Trash2 } from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";
import { IDepartment } from "@/types";

export default function DepartmentsTab({ departments, onEdit, onDelete }: { departments: IDepartment[]; onEdit: (d: IDepartment) => void; onDelete: (d: IDepartment) => void }) {
  const columns: ColumnDef<IDepartment>[] = [
    { accessorKey: "code", header: "Code", cell: ({ row }) => <span className="font-mono">{row.getValue("code")}</span> },
    { accessorKey: "name", header: "Department Name", cell: ({ row }) => <span className="font-semibold">{row.getValue("name")}</span> },
    { accessorKey: "_count.staff", header: "Assigned Staff", cell: ({ row }) => <span>{row.original._count?.staff || 0} employees</span> },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-1.5">
            <button onClick={() => onEdit(item)} className="p-1.5 text-neutral-500 hover:text-blue-600 rounded-lg transition cursor-pointer" title="Edit"><Edit2 size={15} /></button>
            <button onClick={() => onDelete(item)} disabled={(item._count?.staff || 0) > 0} className="p-1.5 text-neutral-500 hover:text-red-600 disabled:opacity-30 rounded-lg transition cursor-pointer" title="Delete"><Trash2 size={15} /></button>
          </div>
        );
      },
    },
  ];
  const table = useReactTable({ data: departments, columns, getCoreRowModel: getCoreRowModel() });
  return <DataTable table={table} columns={columns} />;
}