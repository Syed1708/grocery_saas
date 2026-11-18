"use client";
"use no memo";
import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { DataTable } from "@/components/common/data-table/DataTable";
import { TableActions } from "@/components/common/ui/table/TableHelpers";
import { IDepartment, PERMISSIONS } from "@/types";

export default function DepartmentsTab({ departments, onEdit, onDelete }: { departments: IDepartment[]; onEdit: (d: IDepartment) => void; onDelete: (d: IDepartment) => void }) {
  const columns: ColumnDef<IDepartment>[] = [
    { accessorKey: "code", header: "Code", cell: ({ row }) => <span className="font-mono">{row.getValue("code")}</span> },
    { accessorKey: "name", header: "Department Name", cell: ({ row }) => <span className="font-semibold">{row.getValue("name")}</span> },
    { accessorKey: "_count.staff", header: "Assigned Staff", cell: ({ row }) => <span>{row.original._count?.staff || 0} employees</span> },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <TableActions
          onEdit={() => onEdit(row.original)}
          editPermission={PERMISSIONS.STAFF_MANAGE}
          onDelete={() => onDelete(row.original)}
          canDelete={(row.original._count?.staff || 0) === 0}
          deletePermission={PERMISSIONS.STAFF_MANAGE}
        />
      ),
    },
  ];
  const table = useReactTable({ data: departments, columns, getCoreRowModel: getCoreRowModel() });
  return <DataTable table={table} columns={columns} />;
}
