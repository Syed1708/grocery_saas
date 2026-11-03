"use client";
"use no memo";

import { useState, useMemo } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Edit2, Trash2, DollarSign, History, Search } from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";
import { ISupplier } from "@/types";

interface SuppliersTabProps {
  suppliers: ISupplier[];
  currencySymbol: string;
  onEdit: (s: ISupplier) => void;
  onDelete?: (s: ISupplier) => void;
  onPay: (s: ISupplier) => void;
  onHistory: (s: ISupplier) => void;
}

export default function SuppliersTab({
  suppliers = [],
  currencySymbol = "৳",
  onEdit,
  onDelete,
  onPay,
  onHistory,
}: SuppliersTabProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return suppliers;
    const q = search.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.companyName?.toLowerCase().includes(q) ||
        s.phone.includes(q)
    );
  }, [suppliers, search]);

  const columns: ColumnDef<ISupplier>[] = [
    {
      accessorKey: "companyName",
      header: "Company / Distributor",
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
      header: "Phone & Area",
      cell: ({ row }) => (
        <div>
          <span className="font-mono text-xs text-neutral-700 dark:text-neutral-300 block">
            {row.getValue("phone")}
          </span>
          {row.original.village && (
            <span className="text-[10px] text-neutral-400">{row.original.village}</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "currentDue",
      header: "Payable Due (বাকি দেনা)",
      cell: ({ row }) => {
        const due = Number(row.getValue("currentDue") || 0);
        return (
          <span className={`font-mono font-bold text-xs ${due > 0 ? "text-rose-600" : "text-emerald-600"}`}>
            {currencySymbol}{due.toFixed(2)}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const s = row.original;
        return (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPay(s)}
              className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition flex items-center gap-1 cursor-pointer"
              title="বকেয়া পরিশোধ"
            >
              <DollarSign size={12} /> Pay
            </button>
            <button
              type="button"
              onClick={() => onHistory(s)}
              className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
              title="পেমেন্ট হিস্ট্রি"
            >
              <History size={14} />
            </button>
            <button
              type="button"
              onClick={() => onEdit(s)}
              className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
              title="তথ্য সম্পাদনা"
            >
              <Edit2 size={14} />
            </button>
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(s)}
                className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer"
                title="সাপ্লায়ার মুছুন"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3.5 rounded-2xl shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-neutral-400" size={15} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="সাপ্লায়ার বা কোম্পানির নাম ও মোবাইল নম্বর দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-neutral-900 dark:text-neutral-100"
          />
        </div>
      </div>
      <DataTable table={table} columns={columns} />
    </div>
  );
}