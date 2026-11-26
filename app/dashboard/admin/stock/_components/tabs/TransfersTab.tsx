"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowLeftRight,
  Search,
  Calendar,
  Printer,
  Eye,
  PackageCheck,
  Ban,
  ArrowUpRight,
  ArrowDownLeft,
  Edit2,
} from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";
import { IStockTransfer } from "@/types/stock-transfer";

interface Props {
  transfers: IStockTransfer[];
  currentBranchId: string;
  currencySymbol?: string;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  onReceive: (t: IStockTransfer) => void;
  onEdit?: (t: IStockTransfer) => void; // 👈 Add onEdit
  onView: (t: IStockTransfer) => void;
  onPrint: (t: IStockTransfer) => void;
  onCancel?: (t: IStockTransfer) => void;
}

export default function TransfersTab({
  transfers = [],
  currentBranchId,
  currencySymbol = "৳",
  pagination,
  onReceive,
  onEdit, // 👈 Add onEdit
  onView,
  onPrint,
  onCancel,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const directionFilter = searchParams.get("transfersDirection") || "ALL";
  const [search, setSearch] = useState(searchParams.get("transfersQ") || "");
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
      params.delete("transfersPage");
    });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => updateFilter("transfersQ", value), 350);
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
        params.delete("transfersPage");
        params.delete("wastagesPage");
      } else if (nextPage <= 1) {
        params.delete("transfersPage");
      } else {
        params.set("transfersPage", String(nextPage));
      }
    });
  };

  const columns: ColumnDef<IStockTransfer>[] = [
    {
      accessorKey: "transferNo",
      header: "চালান #",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
          <ArrowLeftRight size={13} className="text-blue-500" />
          #{row.getValue("transferNo")}
        </span>
      ),
    },
    {
      accessorKey: "direction",
      header: "দিক / শাখা",
      cell: ({ row }) => {
        const t = row.original;
        const isOutbound = t.fromBranchId === currentBranchId;

        return (
          <div className="text-xs">
            {isOutbound ? (
              <span className="inline-flex items-center gap-1 font-semibold text-purple-600 dark:text-purple-400">
                <ArrowUpRight size={12} /> পাঠানো হয়েছে ➔ {t.toBranchName}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <ArrowDownLeft size={12} /> আগমনী ➔ {t.fromBranchName} থেকে
              </span>
            )}
            {t.driverName && (
              <div className="text-[10px] text-neutral-400">
                ড্রাইভার: {t.driverName} {t.vehicleNo ? `(${t.vehicleNo})` : ""}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "totalQuantity",
      header: "পরিমাণ",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-neutral-800 dark:text-neutral-200">
          {row.original.totalQuantity} টি / {row.original.items.length} আইটেম
        </span>
      ),
    },
    {
      accessorKey: "totalCost",
      header: "চালান মূল্য",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-neutral-900 dark:text-neutral-100">
          {currencySymbol}{row.original.totalCost.toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "অবস্থা",
      cell: ({ row }) => {
        const s = row.original.status;
        return (
          <span
            className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase inline-flex items-center gap-1 ${
              s === "COMPLETED"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                : s === "CANCELLED"
                ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
            }`}
          >
            {s === "COMPLETED"
              ? "গৃহীত (Received)"
              : s === "CANCELLED"
              ? "বাতিল"
              : "ট্রানজিটে আছে (In-Transit)"}
          </span>
        );
      },
    },
    {
      accessorKey: "dispatchDate",
      header: "তারিখ",
      cell: ({ row }) => (
        <span className="text-neutral-500 text-xs flex items-center gap-1 font-mono">
          <Calendar size={12} className="text-neutral-400" />
          {new Date(row.original.dispatchDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "অ্যাকশন",
      cell: ({ row }) => {
        const t = row.original;
        const isReceiver = t.toBranchId === currentBranchId;
        const canReceive = isReceiver && t.status === "DISPATCHED";
        const canCancel = t.fromBranchId === currentBranchId && t.status === "DISPATCHED";

        return (
          <div className="flex items-center gap-1">
            {/* 1-Click Receive at Destination Branch */}
            {canReceive && (
              <button
                type="button"
                onClick={() => onReceive(t)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition shadow-xs cursor-pointer"
                title="মাল বুঝে নিয়ে স্টকে যোগ করুন"
              >
                <PackageCheck size={13} /> মাল গ্রহণ করুন
              </button>
            )}

            {/* Print Gate Pass */}
            <button
              type="button"
              onClick={() => onPrint(t)}
              className="p-1.5 text-neutral-500 hover:text-purple-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              title="গেট পাস ও ডেলিভারি চালান প্রিন্ট"
            >
              <Printer size={14} />
            </button>

            {/* View Details */}
            <button
              type="button"
              onClick={() => onView(t)}
              className="p-1.5 text-neutral-500 hover:text-blue-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              title="বিস্তারিত দেখুন"
            >
              <Eye size={14} />
            </button>
            {onEdit && t.fromBranchId === currentBranchId && t.status === "DISPATCHED" && (
  <button
    type="button"
    onClick={() => onEdit(t)}
    className="p-1.5 text-neutral-500 hover:text-emerald-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
    title="চালান সম্পাদনা করুন"
  >
    <Edit2 size={14} />
  </button>
)}

            {/* Cancel (Only if still in transit from sender) */}
            {canCancel && onCancel && (
              <button
                type="button"
                onClick={() => onCancel(t)}
                className="p-1.5 text-neutral-500 hover:text-red-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                title="চালান বাতিল ও স্টক ফেরত"
              >
                <Ban size={14} />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: transfers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.max(1, Math.ceil(pagination.total / pagination.pageSize)),
    state: { pagination: { pageIndex: pagination.page - 1, pageSize: pagination.pageSize } },
    onPaginationChange: (updater) => {
      const current = { pageIndex: pagination.page - 1, pageSize: pagination.pageSize };
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
            placeholder="চালান নম্বর বা ব্রাঞ্চের নাম দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 shrink-0 mr-1">
            ফিল্টার:
          </span>
          {[
            { label: "সব চালান (All)", value: "ALL" },
            { label: "রাস্তায় আছে (In-Transit)", value: "IN_TRANSIT" },
            { label: "আগত মাল (Inbound)", value: "INBOUND" },
            { label: "পাঠানো মাল (Outbound)", value: "OUTBOUND" },
          ].map((pill) => (
            <button
              key={pill.value}
              type="button"
              onClick={() => updateFilter("transfersDirection", pill.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition shrink-0 cursor-pointer ${
                directionFilter === pill.value
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