"use client";
"use no memo";
import { ColumnDef, getCoreRowModel, getPaginationRowModel, useReactTable } from "@tanstack/react-table";
import { DataTable } from "@/components/common/data-table/DataTable";
import { TableActions } from "@/components/common/ui/table/TableHelpers";
import { IExpenseCategory, PERMISSIONS } from "@/types";

export default function ExpenseCategoriesTab({ categories, onEdit, onDelete }: { categories: IExpenseCategory[]; onEdit: (c: IExpenseCategory) => void; onDelete: (c: IExpenseCategory) => void }) {
  const columns: ColumnDef<IExpenseCategory>[] = [
    { accessorKey: "code", header: "Code", cell: ({ row }) => <span className="font-mono">{row.getValue("code")}</span> },
    { accessorKey: "name", header: "Expense Type Name", cell: ({ row }) => <span className="font-semibold">{row.getValue("name")}</span> },
    { accessorKey: "description", header: "Description", cell: ({ row }) => <span className="text-neutral-400">{row.getValue("description") || "—"}</span> },
    { accessorKey: "_count.expenses", header: "Linked Expenses", cell: ({ row }) => <span>{row.original._count?.expenses || 0} records</span> },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <TableActions
          onEdit={() => onEdit(row.original)}
          editPermission={PERMISSIONS.FINANCE_EXPENSES}
          onDelete={() => onDelete(row.original)}
          canDelete={(row.original._count?.expenses || 0) === 0}
          deletePermission={PERMISSIONS.FINANCE_EXPENSES}
        />
      ),
    },
  ];
  const table = useReactTable({ data: categories, columns, getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel() });
  return <DataTable table={table} columns={columns} />;
}
