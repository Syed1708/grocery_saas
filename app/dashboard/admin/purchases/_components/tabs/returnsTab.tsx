"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  RotateCcw,
  Printer,
  Eye,
  Trash2,
  Search,
  Calendar,
  ArrowDownLeft,
  Banknote,
} from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";
import { IPurchaseReturn } from "@/types/purchase-return";

interface ReturnsTabProps {
  returns: IPurchaseReturn[];
  currencySymbol: string;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  onView?: (r: IPurchaseReturn) => void;
  onPrint: (r: IPurchaseReturn, format?: "80mm" | "58mm" | "a4") => void;
  onDelete?: (r: IPurchaseReturn) => void;
}

export default function ReturnsTab({
  returns = [],
  currencySymbol = "৳",
  pagination,
  onView,
  onPrint,
  onDelete,
}: ReturnsTabProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const settlementFilter = searchParams.get("returnsSettlement") || "ALL";
  const [search, setSearch] = useState(searchParams.get("returnsQ") || "");
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
      params.delete("returnsPage");
    });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => updateFilter("returnsQ", value), 350);
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
        params.delete("returnsPage");
        params.delete("ordersPage");
      } else if (nextPage <= 1) {
        params.delete("returnsPage");
      } else {
        params.set("returnsPage", String(nextPage));
      }
    });
  };

  const columns: ColumnDef<IPurchaseReturn>[] = [
    {
      accessorKey: "returnNo",
      header: "ভাউচার #",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
          <RotateCcw size={13} className="text-neutral-400" />
          #{row.getValue("returnNo")}
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
      accessorKey: "totalAmount",
      header: "মোট ফেরত মূল্য",
      cell: ({ row }) => (
        <span className="font-bold text-neutral-900 dark:text-neutral-100 text-xs font-mono">
          {currencySymbol}{Number(row.getValue("totalAmount")).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: "settlementType",
      header: "সমন্বয় ধরণ",
      cell: ({ row }) => {
        const type = row.original.settlementType;
        return (
          <span
            className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase inline-flex items-center gap-1 ${
              type === "DUE_DEDUCTION"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400"
            }`}
          >
            {type === "DUE_DEDUCTION" ? <ArrowDownLeft size={11} /> : <Banknote size={11} />}
            {type === "DUE_DEDUCTION" ? "বাকি সমন্বয় (Khata)" : "নগদ রিফান্ড"}
          </span>
        );
      },
    },
    {
      accessorKey: "breakdown",
      header: "সমন্বয়ের বিবরণ",
      cell: ({ row }) => (
        <div className="text-[11px] font-mono space-y-0.5">
          {Number(row.original.dueDeduction) > 0 && (
            <span className="text-emerald-600 dark:text-emerald-400 block font-medium">
              বাকি কমেছে: {currencySymbol}{Number(row.original.dueDeduction).toFixed(2)}
            </span>
          )}
          {Number(row.original.refundAmount) > 0 && (
            <span className="text-blue-600 dark:text-blue-400 block font-medium">
              নগদ গ্রহণ: {currencySymbol}{Number(row.original.refundAmount).toFixed(2)}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "returnDate",
      header: "ফেরতের তারিখ",
      cell: ({ row }) => (
        <span className="text-neutral-500 text-xs flex items-center gap-1 font-mono">
          <Calendar size={12} className="text-neutral-400" />
          {new Date(row.original.returnDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "অ্যাকশন",
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPrint(r, "80mm")}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-purple-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="80mm থার্মাল প্রিন্ট"
            >
              <Printer size={15} />
            </button>
            <button
              type="button"
              onClick={() => onPrint(r, "a4")}
              className="px-1.5 py-1 text-[10px] font-bold rounded-lg text-neutral-500 hover:text-purple-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="A4 ডেবিট ভাউচার প্রিন্ট"
            >
              A4
            </button>
            {onView && (
              <button
                type="button"
                onClick={() => onView(r)}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                title="বিস্তারিত দেখুন"
              >
                <Eye size={15} />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(r)}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                title="ভাউচার মুছুন"
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
    data: returns,
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
            placeholder="ভাউচার নম্বর, কোম্পানি বা সরবরাহকারীর নাম দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-neutral-900 dark:text-neutral-100"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 shrink-0 mr-1">
            ফিল্টার:
          </span>
          {[
            { label: "সব ফেরত (All)", value: "ALL" },
            { label: "বাকি সমন্বয় (Due Deduction)", value: "DUE_DEDUCTION" },
            { label: "নগদ ফেরত (Cash Refund)", value: "CASH_REFUND" },
          ].map((pill) => (
            <button
              key={pill.value}
              type="button"
              onClick={() => updateFilter("returnsSettlement", pill.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition shrink-0 cursor-pointer ${
                settlementFilter === pill.value
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