"use client";
"use no memo";
import { ColumnDef, getCoreRowModel, getPaginationRowModel, useReactTable } from "@tanstack/react-table";
import { DataTable } from "@/components/common/data-table/DataTable";
import { TableActions } from "@/components/common/ui/table/TableHelpers";
import { IOtherIncome, PERMISSIONS } from "@/types";

export default function IncomesTab({ incomes, currencySymbol, onEdit, onDelete }: { incomes: IOtherIncome[]; currencySymbol: string; onEdit: (i: IOtherIncome) => void; onDelete: (i: IOtherIncome) => void }) {
  const columns: ColumnDef<IOtherIncome>[] = [
    { accessorKey: "receiptNo", header: "Receipt #", cell: ({ row }) => <span className="font-mono font-bold">#{row.getValue("receiptNo")}</span> },
    { accessorKey: "incomeSource", header: "Income Source", cell: ({ row }) => <span className="font-semibold">{row.getValue("incomeSource")}</span> },
    { accessorKey: "amount", header: "Amount", cell: ({ row }) => <span className="font-black text-emerald-600 font-mono">{currencySymbol}{Number(row.getValue("amount")).toFixed(2)}</span> },
    { accessorKey: "incomeDate", header: "Date", cell: ({ row }) => <span>{new Date(row.original.incomeDate).toLocaleDateString()}</span> },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <TableActions
          onEdit={() => onEdit(row.original)}
          editPermission={PERMISSIONS.FINANCE_EXPENSES}
          onDelete={() => onDelete(row.original)}
          deletePermission={PERMISSIONS.FINANCE_EXPENSES}
        />
      ),
    },
  ];
  const table = useReactTable({ data: incomes, columns, getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel() });
  return <DataTable table={table} columns={columns} />;
}
