"use client";

import { ColumnDef } from "@tanstack/react-table";
import { IPurchaseReportRow } from "@/types/purchases";
import PurchaseRowActions from "./PurchaseRowActions";

export const getPurchaseColumns = (
  currency: string,
  onViewDetails: (row: IPurchaseReportRow) => void
): ColumnDef<IPurchaseReportRow>[] => [
  {
    accessorKey: "chalanNo",
    header: "চালান নং (Chalan)",
    cell: ({ row }) => (
      <div>
        <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 block">
          #{row.getValue("chalanNo")}
        </span>
        <span className="text-[10px] text-neutral-400 font-mono">
          {new Date(row.original.purchaseDate).toLocaleDateString()}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "supplierName",
    header: "সাপ্লায়ার / মহাজন",
    cell: ({ row }) => (
      <div>
        <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100 block">
          {row.original.supplierName}
        </span>
        <span className="text-[11px] text-neutral-400">
          {row.original.companyName || "Local Distributor"}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "itemCount",
    header: "পণ্যের সংখ্যা",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-neutral-500">
        {row.original.itemCount} টি ({row.original.totalQuantity} একক)
      </span>
    ),
  },
  {
    accessorKey: "grandTotal",
    header: "মোট চালান মান",
    cell: ({ row }) => (
      <span className="font-mono text-xs font-bold text-neutral-900 dark:text-neutral-100">
        {currency}{row.original.grandTotal.toFixed(2)}
      </span>
    ),
  },
  {
    accessorKey: "paidAmount",
    header: "পরিশোধ",
    cell: ({ row }) => (
      <span className="font-mono text-xs font-bold text-emerald-600">
        {currency}{row.original.paidAmount.toFixed(2)}
      </span>
    ),
  },
  {
    accessorKey: "dueAmount",
    header: "বকেয়া দেনা",
    cell: ({ row }) => (
      <span className={`font-mono text-xs font-black ${row.original.dueAmount > 0 ? "text-red-600" : "text-neutral-400"}`}>
        {currency}{row.original.dueAmount.toFixed(2)}
      </span>
    ),
  },
  {
    accessorKey: "paymentStatus",
    header: "অবস্থা",
    cell: ({ row }) => {
      const status = row.original.paymentStatus;
      let badge = "bg-neutral-100 text-neutral-600";
      if (status === "PAID") badge = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400";
      if (status === "PARTIAL") badge = "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400";
      if (status === "DUE") badge = "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400";

      return (
        <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded uppercase tracking-wider ${badge}`}>
          {status}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "অ্যাকশন",
    cell: ({ row }) => (
      <PurchaseRowActions row={row.original} onViewDetails={onViewDetails} />
    ),
  },
];