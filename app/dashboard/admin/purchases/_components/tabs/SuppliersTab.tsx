// app/dashboard/admin/purchases/_components/tabs/SuppliersTab.tsx
"use client";

import { useState, useMemo } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Building2,
  Phone,
  History,
  Edit2,
  Trash2,
  Search,
} from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";

interface SuppliersTabProps {
  suppliers: any[];
  currencySymbol: string;
  onEdit: (s: any) => void;
  onDelete: (s: any) => void;
  onPay: (s: any) => void;
  onHistory: (s: any) => void;
}

export default function SuppliersTab({
  suppliers,
  currencySymbol,
  onEdit,
  onDelete,
  onPay,
  onHistory,
}: SuppliersTabProps) {
  const [search, setSearch] = useState("");

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        s.companyName?.toLowerCase().includes(q) ||
        s.name?.toLowerCase().includes(q) ||
        s.phone?.toLowerCase().includes(q)
      );
    });
  }, [suppliers, search]);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "companyName",
      header: "Distributor / Company",
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
            <Building2 size={14} className="text-neutral-400" />
            {row.getValue("companyName")}
          </span>
          <span className="text-[11px] text-neutral-400">Contact: {row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <span className="text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-1 font-mono">
          <Phone size={11} className="text-neutral-400" />
          {row.getValue("phone")}
        </span>
      ),
    },
    {
      accessorKey: "currentDue",
      header: "Outstanding Balance",
      cell: ({ row }) => {
        const debt = Number(row.original.currentDue ?? row.original.payableBalance ?? 0);
        const hasDebt = debt > 0;
        return (
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 text-xs font-bold rounded-lg ${
                hasDebt
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
              }`}
            >
              {currencySymbol}{debt.toFixed(2)} {hasDebt ? "Owed" : "Cleared"}
            </span>
            {hasDebt && (
              <button
                onClick={() => onPay(row.original)}
                className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                + Pay
              </button>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const s = row.original;
        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onHistory(s)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-purple-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="View Payment Ledger"
            >
              <History size={15} />
            </button>
            <button
              onClick={() => onEdit(s)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="Edit Profile"
            >
              <Edit2 size={15} />
            </button>
            <button
              onClick={() => onDelete(s)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="Delete Supplier"
            >
              <Trash2 size={15} />
            </button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredSuppliers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 rounded-2xl shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendor company, contact, or phone..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-neutral-900 dark:text-neutral-100"
          />
        </div>
      </div>

      <DataTable table={table} columns={columns} />
    </div>
  );
}