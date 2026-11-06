"use client";

import { ColumnDef } from "@tanstack/react-table";
import { IStockReportRow } from "@/types/stock";
import { AlertCircle, Clock } from "lucide-react";
import StockRowActions from "./StockRowActions";

export const getStockColumns = (
  currency: string,
  canViewCost: boolean = true
): ColumnDef<IStockReportRow>[] => {
  // Helper for safe decimal formatting
  const formatMoney = (val?: number | string | null) => Number(val || 0).toFixed(2);

  const columns: ColumnDef<IStockReportRow>[] = [
    // 1. Product Info & Demographics
    {
      accessorKey: "productName",
      header: "পণ্য বিবরণী",
      cell: ({ row }) => (
        <div>
          <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100 block">
            {row.original.productName}
          </span>
          <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono mt-0.5">
            <span>{row.original.barcode}</span>
            <span>•</span>
            <span>{row.original.categoryName}</span>
            {row.original.brandName && (
              <>
                <span>•</span>
                <span className="text-neutral-500 dark:text-neutral-300 font-semibold">{row.original.brandName}</span>
              </>
            )}
          </div>
        </div>
      ),
    },

    // 2. Shelf / Rack Location
    {
      accessorKey: "sectionCode",
      header: "তাক / র্যাক",
      cell: ({ row }) => (
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
          {row.original.sectionCode || "N/A"}
        </span>
      ),
    },

    // 3. Current Stock & Safety Buffer
    {
      accessorKey: "quantity",
      header: "মজুদ পরিমাণ",
      cell: ({ row }) => {
        const qty = Number(row.original.quantity ?? 0);
        const unit = row.original.unitCode || "pcs";
        const isLow = row.original.stockStatus === "LOW_STOCK";
        const isOut = row.original.stockStatus === "OUT_OF_STOCK";

        return (
          <div>
            <div className="flex items-center gap-1 font-mono font-black text-xs">
              <span className={isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-neutral-900 dark:text-neutral-100"}>
                {qty} {unit}
              </span>
              {isLow && <AlertCircle size={12} className="text-amber-600" />}
              {isOut && <AlertCircle size={12} className="text-red-600" />}
            </div>
            <span className="text-[10px] text-neutral-400 font-mono block">
              অ্যালার্ট সীমা: {Number(row.original.alertQuantity ?? 0)} {unit}
            </span>
          </div>
        );
      },
    },
  ];

  // 🛡️ ROLE-BASED INJECTION: Wholesale Purchase Price (Owner & Manager Only)
  if (canViewCost) {
    columns.push({
      accessorKey: "purchasePrice",
      header: "ক্রয় দর (Cost)",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-neutral-500">
          {currency}{formatMoney(row.original.purchasePrice)}
        </span>
      ),
    });
  }

  // 4. Retail Selling Price
  columns.push({
    accessorKey: "sellingPrice",
    header: "বিক্রয় দর (Retail)",
    cell: ({ row }) => (
      <span className="font-mono text-xs font-semibold text-neutral-900 dark:text-neutral-100">
        {currency}{formatMoney(row.original.sellingPrice)}
      </span>
    ),
  });

  // 🛡️ ROLE-BASED INJECTION: Capital Cost Valuation & Margin % (Owner & Manager Only)
  if (canViewCost) {
    columns.push(
      {
        accessorKey: "totalCostValue",
        header: "মোট ক্রয় মান",
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            {currency}{formatMoney(row.original.totalCostValue)}
          </span>
        ),
      },
      {
        accessorKey: "profitMarginPercent",
        header: "মার্জিন %",
        cell: ({ row }) => {
          const margin = Number(row.original.profitMarginPercent ?? 0);
          return (
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
              margin > 0 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400" : "bg-neutral-100 text-neutral-500"
            }`}>
              {margin.toFixed(1)}%
            </span>
          );
        },
      }
    );
  }

  // 5. Total Retail Valuation
  columns.push({
    accessorKey: "totalRetailValue",
    header: "মোট বিক্রয় মান",
    cell: ({ row }) => (
      <span className="font-mono text-xs font-black text-blue-600 dark:text-blue-400">
        {currency}{formatMoney(row.original.totalRetailValue)}
      </span>
    ),
  });

  // 6. Expiry Watch
  columns.push({
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

      const parsed = new Date(rawDate);
      return (
        <span className="text-xs font-mono text-neutral-500">
          {!isNaN(parsed.getTime()) ? parsed.toLocaleDateString() : "-"}
        </span>
      );
    },
  });

  // 7. Actions
  columns.push({
    id: "actions",
    header: "অ্যাকশন",
    cell: ({ row }) => <StockRowActions row={row.original} />,
  });

  return columns;
};