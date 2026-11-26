// app/dashboard/admin/purchases/_components/tabs/InvoicesTab.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ColumnDef,
  getCoreRowModel,
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
import { IPurchase } from "@/types/purchase";

interface InvoicesTabProps {
  purchases: IPurchase[];
  currencySymbol: string;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  onView: (p: IPurchase) => void;
  onPrint: (p: IPurchase) => void;
  onDelete?: (p: IPurchase) => void; // Optional for non-owners
}

export default function InvoicesTab({
  purchases = [],
  currencySymbol = "৳",
  pagination,
  onView,
  onPrint,
  onDelete,
}: InvoicesTabProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") || "ALL";
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  const updateParams = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParamsRef.current.toString());
    mutate(params);
    router.push(`${pathname}?${params.toString()}`);
  };

  const updateFilter = (key: string, value: string) => {
    updateParams((params) => {
      if (value && value !== "ALL") params.set(key, value);
      else params.delete(key);
      params.delete("page");
    });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => updateFilter("q", value), 350);
  };

  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  const updatePagination = (nextPage: number, nextPageSize: number) => {
    updateParams((params) => {
      if (nextPageSize !== pagination.pageSize) {
        params.set("pageSize", String(nextPageSize));
        params.delete("page");
      } else if (nextPage <= 1) {
        params.delete("page");
      } else {
        params.set("page", String(nextPage));
      }
    });
  };

  const columns: ColumnDef<IPurchase>[] = [
    {
      accessorKey: "chalanNo",
      header: "চালান #",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
          <Receipt size={13} className="text-neutral-400" />
          #{row.getValue("chalanNo")}
        </span>
      ),
    },
    {
      accessorKey: "supplierCompany",
      header: "ডিস্ট্রিবিউটর / সাপ্লায়ার",
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">
            {row.original.supplierCompany || row.original.supplierName}
          </span>
          <span className="text-[11px] text-neutral-400">SR: {row.original.supplierName}</span>
        </div>
      ),
    },
    {
      accessorKey: "grandTotal",
      header: "চালান মূল্য",
      cell: ({ row }) => (
        <span className="font-bold text-neutral-900 dark:text-neutral-100 text-xs font-mono">
          {currencySymbol}{Number(row.getValue("grandTotal")).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: "paidAmount",
      header: "পরিশোধ / বাকি",
      cell: ({ row }) => (
        <div className="text-xs font-mono">
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold block">
            পরিশোধ: {currencySymbol}{Number(row.original.paidAmount).toFixed(2)}
          </span>
          {Number(row.original.dueAmount) > 0 && (
            <span className="text-red-600 dark:text-red-400 font-semibold block">
              বাকি: {currencySymbol}{Number(row.original.dueAmount).toFixed(2)}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "paymentStatus",
      header: "পেমেন্ট অবস্থা",
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
            {status === "PAID" ? "পরিশোধিত" : status === "PARTIAL" ? "আংশিক বাকি" : "সম্পূর্ণ বাকি"}
          </span>
        );
      },
    },
    {
      accessorKey: "purchaseDate",
      header: "ইনওয়ার্ড তারিখ",
      cell: ({ row }) => (
        <span className="text-neutral-500 text-xs flex items-center gap-1 font-mono">
          <Calendar size={12} className="text-neutral-400" />
          {new Date(row.original.purchaseDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "অ্যাকশন",
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPrint(p)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-purple-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="চালান প্রিন্ট"
            >
              <Printer size={15} />
            </button>
            <button
              type="button"
              onClick={() => onView(p)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="চালান বিস্তারিত দেখুন"
            >
              <Eye size={15} />
            </button>
            <Link
              href={`/dashboard/admin/purchases/${p.id}/edit`}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-emerald-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="সম্পাদনা করুন"
            >
              <Edit2 size={15} />
            </Link>

            {/* 🛡️ Guarded Delete button: Only renders if user is OWNER */}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(p)}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                title="চালান মুছে ফেলুন"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: purchases,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.max(1, Math.ceil(pagination.total / pagination.pageSize)),
    state: {
      pagination: {
        pageIndex: pagination.page - 1,
        pageSize: pagination.pageSize,
      },
    },
    onPaginationChange: (updater) => {
      const current = {
        pageIndex: pagination.page - 1,
        pageSize: pagination.pageSize,
      };
      const next = typeof updater === "function" ? updater(current) : updater;
      updatePagination(next.pageIndex + 1, next.pageSize);
    },
  });

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl space-y-3 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="চালান নম্বর, কোম্পানি বা সরবরাহকারীর নাম দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-neutral-900 dark:text-neutral-100"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 shrink-0 mr-1">
            ফিল্টার:
          </span>
          {[
            { label: "সব চালান (All)", value: "ALL" },
            { label: "পরিশোধিত (Paid)", value: "PAID" },
            { label: "আংশিক বাকি (Partial)", value: "PARTIAL" },
            { label: "বাকি চালান (Due)", value: "DUE" },
          ].map((pill) => (
            <button
              key={pill.value}
              type="button"
              onClick={() => updateFilter("status", pill.value)}
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

      <DataTable table={table} columns={columns} totalCount={pagination.total} />
    </div>
  );
}