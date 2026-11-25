"use client";
"use no memo";
import { ColumnDef, getCoreRowModel, getPaginationRowModel, useReactTable } from "@tanstack/react-table";
import { DataTable } from "@/components/common/data-table/DataTable";
import { TableActions } from "@/components/common/ui/table/TableHelpers";
import { IStaff, PERMISSIONS } from "@/types";

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
      cell: ({ row }) => (
        <TableActions
          onEdit={() => onEdit(row.original)}
          editPermission={PERMISSIONS.STAFF_MANAGE}
          onDelete={() => onDelete(row.original)}
          deletePermission={PERMISSIONS.STAFF_MANAGE}
        />
      ),
    },
  ];
  const table = useReactTable({ data: staff, columns, getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel() });
  return <DataTable table={table} columns={columns} />;
}
