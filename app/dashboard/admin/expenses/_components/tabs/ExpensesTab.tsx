"use client";
"use no memo";
import { ColumnDef, getCoreRowModel, getPaginationRowModel, useReactTable } from "@tanstack/react-table";
import { DataTable } from "@/components/common/data-table/DataTable";
import { TableActions } from "@/components/common/ui/table/TableHelpers";
import { IExpense, PERMISSIONS } from "@/types";

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
  const table = useReactTable({ data: expenses, columns, getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel() });
  return <DataTable table={table} columns={columns} />;
}
