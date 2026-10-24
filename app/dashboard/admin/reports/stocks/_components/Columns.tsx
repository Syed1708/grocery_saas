"use client";

import { ColumnDef } from "@tanstack/react-table";
import { IStockReportRow } from "@/types/stock";
import { AlertCircle, Clock } from "lucide-react";
import StockRowActions from "./StockRowActions";

export const getStockColumns = (currency: string): ColumnDef<IStockReportRow>[] => [
  {
    accessorKey: "productName",
    header: "পণ্য বিবরণী",
    cell: ({ row }) => (
      <div>
        <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100 block">
          {row.original.productName}
        </span>
        <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-mono">
          <span>{row.original.barcode}</span>
          <span>•</span>
          <span>{row.original.categoryName}</span>
          {row.original.brandName && (
            <>
              <span>•</span>
              <span>{row.original.brandName}</span>
            </>
          )}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "sectionCode",
    header: "তাক/র্যাক",
    cell: ({ row }) => (
      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
        {row.original.sectionCode || "N/A"}
      </span>
    ),
  },
  {
    accessorKey: "quantity",
    header: "মজুদ পরিমাণ",
    cell: ({ row }) => {
      const qty = row.original.quantity ?? 0;
      const isLow = row.original.stockStatus === "LOW_STOCK";
      const isOut = row.original.stockStatus === "OUT_OF_STOCK";

      return (
        <div>
          <div className="flex items-center gap-1 font-mono font-bold text-xs">
            <span className={isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-neutral-900 dark:text-neutral-100"}>
              {qty} {row.original.unitCode}
            </span>
            {isLow && <AlertCircle size={12} className="text-amber-600" />}
            {isOut && <AlertCircle size={12} className="text-red-600" />}
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">
            অ্যালার্ট: {row.original.alertQuantity ?? 0} {row.original.unitCode}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "purchasePrice",
    header: "ক্রয় মূল্য",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-neutral-500">
        {currency}{(row.original.purchasePrice ?? 0).toFixed(2)}
      </span>
    ),
  },
  {
    accessorKey: "sellingPrice",
    header: "বিক্রয় মূল্য",
    cell: ({ row }) => (
      <span className="font-mono text-xs font-semibold text-neutral-900 dark:text-neutral-100">
        {currency}{(row.original.sellingPrice ?? 0).toFixed(2)}
      </span>
    ),
  },
  {
    accessorKey: "totalCostValue",
    header: "মোট ক্রয় মান",
    cell: ({ row }) => (
      <span className="font-mono text-xs font-semibold text-neutral-700 dark:text-neutral-300">
        {currency}{(row.original.totalCostValue ?? 0).toFixed(2)}
      </span>
    ),
  },
  {
    accessorKey: "totalRetailValue",
    header: "মোট বিক্রয় মান",
    cell: ({ row }) => (
      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
        {currency}{(row.original.totalRetailValue ?? 0).toFixed(2)}
      </span>
    ),
  },
  {
    accessorKey: "expiryDate",
    header: "মেয়াদ",
    cell: ({ row }) => {
      const exp = row.original.expiryStatus;
      const days = row.original.daysUntilExpiry ?? 0;
      const rawDate = row.original.expiryDate;

      if (exp === "NO_EXPIRY" || !rawDate) {
        return <span className="text-[10px] text-neutral-400">মেয়াদহীন</span>;
      }

      if (exp === "EXPIRED") {
        return (
          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
            মেয়াদ শেষ! ({Math.abs(days)} দিন আগে)
          </span>
        );
      }

      if (exp === "EXPIRING_SOON") {
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <Clock size={11} /> {days} দিন বাকি
          </span>
        );
      }

      // Safe date formatter
      try {
        const parsed = new Date(rawDate);
        return (
          <span className="text-xs font-mono text-neutral-500">
            {isNaN(parsed.getTime()) ? "-" : parsed.toLocaleDateString()}
          </span>
        );
      } catch {
        return <span className="text-xs font-mono text-neutral-500">-</span>;
      }
    },
  },
  {
    id: "actions",
    header: "অ্যাকশন",
    cell: ({ row }) => <StockRowActions row={row.original} />,
  },
];