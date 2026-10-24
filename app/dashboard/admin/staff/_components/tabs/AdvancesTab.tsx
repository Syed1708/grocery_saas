"use client";
"use no memo";
import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";
import { ISalaryAdvance } from "@/types";

export default function AdvancesTab({ advances, currencySymbol, onDelete }: { advances: ISalaryAdvance[]; currencySymbol: string; onDelete: (a: ISalaryAdvance) => void }) {
  const columns: ColumnDef<ISalaryAdvance>[] = [
    { accessorKey: "staffName", header: "Staff Member", cell: ({ row }) => <span className="font-semibold">{row.getValue("staffName")}</span> },
    { accessorKey: "amount", header: "Advance Amount", cell: ({ row }) => <span className="font-black text-amber-600 font-mono">{currencySymbol}{Number(row.getValue("amount")).toFixed(2)}</span> },
    { accessorKey: "purpose", header: "Purpose", cell: ({ row }) => <span>{row.getValue("purpose") || "—"}</span> },
    {
      accessorKey: "isDeducted",
      header: "Deducted in Payroll?",
      cell: ({ row }) => (
        <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${row.original.isDeducted ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
          {row.original.isDeducted ? "Yes (Deducted)" : "Pending (Active)"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const item = row.original;
        return (
          !item.isDeducted && (
            <button onClick={() => onDelete(item)} className="p-1.5 text-neutral-500 hover:text-red-600 rounded-lg transition cursor-pointer" title="Delete Advance">
              <Trash2 size={15} />
            </button>
          )
        );
      },
    },
  ];
  const table = useReactTable({ data: advances, columns, getCoreRowModel: getCoreRowModel() });
  return <DataTable table={table} columns={columns} />;
}