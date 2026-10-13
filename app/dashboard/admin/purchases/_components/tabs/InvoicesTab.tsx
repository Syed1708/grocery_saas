// app/dashboard/admin/purchases/_components/tabs/InvoicesTab.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Receipt,
  Trash2,
  Edit2,
  Eye,
  Printer,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";

interface InvoicesTabProps {
  purchases: any[];
  currencySymbol: string;
  onView: (p: any) => void;
  onPrint: (p: any) => void;
  onDelete: (p: any) => void;
}

export default function InvoicesTab({
  purchases,
  currencySymbol,
  onView,
  onPrint,
  onDelete,
}: InvoicesTabProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        const matchesChalan = p.chalanNo?.toLowerCase().includes(q);
        const matchesSupplier =
          p.supplierCompany?.toLowerCase().includes(q) ||
          p.supplierName?.toLowerCase().includes(q);
        if (!matchesChalan && !matchesSupplier) return false;
      }
      if (statusFilter !== "ALL" && p.paymentStatus !== statusFilter) return false;
      return true;
    });
  }, [purchases, search, statusFilter]);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "chalanNo",
      header: "Chalan #",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
          <Receipt size={13} className="text-neutral-400" />
          #{row.getValue("chalanNo")}
        </span>
      ),
    },
    {
      accessorKey: "supplierCompany",
      header: "Distributor / Supplier",
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">
            {row.original.supplierCompany || row.original.supplierName}
          </span>
          <span className="text-[11px] text-neutral-400">Contact: {row.original.supplierName}</span>
        </div>
      ),
    },
    {
      accessorKey: "grandTotal",
      header: "Bill Total",
      cell: ({ row }) => (
        <span className="font-bold text-neutral-900 dark:text-neutral-100 text-xs">
          {currencySymbol}{Number(row.getValue("grandTotal")).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: "paidAmount",
      header: "Paid / Due",
      cell: ({ row }) => (
        <div className="text-xs">
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold block">
            Paid: {currencySymbol}{Number(row.original.paidAmount).toFixed(2)}
          </span>
          {Number(row.original.dueAmount) > 0 && (
            <span className="text-red-600 dark:text-red-400 font-semibold block">
              Due: {currencySymbol}{Number(row.original.dueAmount).toFixed(2)}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "paymentStatus",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.paymentStatus;
        return (
          <span
            className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase inline-flex items-center gap-1 ${
              status === "PAID"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                : status === "PARTIAL"
                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                : "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400"
            }`}
          >
            {status === "PAID" && <CheckCircle2 size={11} />}
            {status === "PARTIAL" && <Clock size={11} />}
            {status === "DUE" && <AlertCircle size={11} />}
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: "purchaseDate",
      header: "Inward Date",
      cell: ({ row }) => (
        <span className="text-neutral-500 text-xs flex items-center gap-1">
          <Calendar size={12} className="text-neutral-400" />
          {new Date(row.original.purchaseDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPrint(p)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-purple-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="Print Chalan"
            >
              <Printer size={15} />
            </button>
            <button
              onClick={() => onView(p)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="View Invoice"
            >
              <Eye size={15} />
            </button>
            <Link
              href={`/dashboard/admin/purchases/${p.id}/edit`}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-emerald-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="Edit Purchase Bill"
            >
              <Edit2 size={15} />
            </Link>
            <button
              onClick={() => onDelete(p)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="Delete Purchase Bill"
            >
              <Trash2 size={15} />
            </button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredPurchases,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl space-y-3 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Chalan number, Distributor, or Supplier..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-neutral-900 dark:text-neutral-100"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 shrink-0 mr-1">
            Filter Status:
          </span>
          {[
            { label: "All Bills", value: "ALL" },
            { label: "Fully Paid", value: "PAID" },
            { label: "Partial Paid", value: "PARTIAL" },
            { label: "Full Due", value: "DUE" },
          ].map((pill) => (
            <button
              key={pill.value}
              onClick={() => setStatusFilter(pill.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition shrink-0 cursor-pointer ${
                statusFilter === pill.value
                  ? "bg-blue-600 text-white font-semibold shadow-xs"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      <DataTable table={table} columns={columns} />
    </div>
  );
}