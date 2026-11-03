"use client";
"use no memo";

import { useMemo } from "react";
import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { DollarSign, History, AlertCircle } from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";
import { ISupplier } from "@/types";

interface SupplierDuesTabProps {
  suppliers: ISupplier[];
  currencySymbol: string;
  onPay: (s: ISupplier) => void;
  onHistory: (s: ISupplier) => void;
}

export default function SupplierDuesTab({
  suppliers = [],
  currencySymbol = "৳",
  onPay,
  onHistory,
}: SupplierDuesTabProps) {
  // Filter only suppliers who currently have open dues > 0
  const suppliersWithDues = useMemo(() => {
    return suppliers.filter((s) => Number(s.currentDue || 0) > 0);
  }, [suppliers]);

  const totalOutstandingDue = useMemo(() => {
    return suppliersWithDues.reduce((sum, s) => sum + Number(s.currentDue || 0), 0);
  }, [suppliersWithDues]);

  const columns: ColumnDef<ISupplier>[] = [
    {
      accessorKey: "companyName",
      header: "Distributor / Vendor",
      cell: ({ row }) => (
        <div>
          <span className="font-bold text-neutral-900 dark:text-neutral-100 text-xs block">
            {row.getValue("companyName") || "N/A"}
          </span>
          <span className="text-[11px] text-neutral-400">SR: {row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => <span className="font-mono text-xs">{row.getValue("phone")}</span>,
    },
    {
      accessorKey: "currentDue",
      header: "Unpaid Balance (বকেয়া দেনা)",
      cell: ({ row }) => (
        <span className="font-mono font-black text-sm text-rose-600 block">
          {currencySymbol}{Number(row.getValue("currentDue") || 0).toFixed(2)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Pay Action",
      cell: ({ row }) => {
        const s = row.original;
        return (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPay(s)}
              className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
            >
              <DollarSign size={13} /> বকেয়া পরিশোধ
            </button>
            <button
              type="button"
              onClick={() => onHistory(s)}
              className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
              title="খাতা ও পেমেন্ট হিস্ট্রি"
            >
              <History size={15} />
            </button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: suppliersWithDues,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      {/* Total Due Banner */}
      <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-rose-100 dark:bg-rose-900/60 rounded-xl text-rose-600">
            <AlertCircle size={20} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-rose-900 dark:text-rose-200">
              মোট মহাজনের বকেয়া দেনা (Total Accounts Payable)
            </h3>
            <p className="text-[11px] text-rose-600 dark:text-rose-400">
              মোট {suppliersWithDues.length} টি সাপ্লায়ারের নিকট দোকান দায়বদ্ধ
            </p>
          </div>
        </div>

        <span className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
          {currencySymbol}{totalOutstandingDue.toLocaleString()}
        </span>
      </div>

      <DataTable table={table} columns={columns} />
    </div>
  );
}