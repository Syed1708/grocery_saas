"use client";
"use no memo";
import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";
import { IPayroll } from "@/types";

export default function PayrollsTab({ payrolls, currencySymbol, onDelete }: { payrolls: IPayroll[]; currencySymbol: string; onDelete: (p: IPayroll) => void }) {
  const columns: ColumnDef<IPayroll>[] = [
    { accessorKey: "payslipNo", header: "Payslip #", cell: ({ row }) => <span className="font-mono font-bold">#{row.getValue("payslipNo")}</span> },
    {
      accessorKey: "staffName",
      header: "Employee",
      cell: ({ row }) => (
        <div>
          <span className="font-semibold">{row.getValue("staffName")}</span>
          <span className="text-[10px] text-neutral-400 block">{row.original.month} {row.original.year}</span>
        </div>
      ),
    },
    { accessorKey: "netSalary", header: "Net Paid", cell: ({ row }) => <span className="font-black text-blue-600 font-mono">{currencySymbol}{Number(row.getValue("netSalary")).toFixed(2)}</span> },
    { accessorKey: "paymentStatus", header: "Status", cell: ({ row }) => <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">{row.getValue("paymentStatus")}</span> },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <button onClick={() => onDelete(item)} className="p-1.5 text-neutral-500 hover:text-red-600 rounded-lg transition cursor-pointer" title="Delete Payslip">
            <Trash2 size={15} />
          </button>
        );
      },
    },
  ];
  const table = useReactTable({ data: payrolls, columns, getCoreRowModel: getCoreRowModel() });
  return <DataTable table={table} columns={columns} />;
}