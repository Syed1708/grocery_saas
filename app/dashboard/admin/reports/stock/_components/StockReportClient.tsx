"use client";
"use no memo";

import { useMemo, useState } from "react";
import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Package, AlertTriangle, Search } from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { IStockReportItem } from "@/types";

export default function StockReportClient({
  data,
  currencySymbol = "৳",
}: {
  data: IStockReportItem[];
  currencySymbol?: string;
}) {
  const [search, setSearch] = useState("");

  const totalCostValuation = data.reduce((sum, item) => sum + item.totalCostValue, 0);
  const totalRetailValuation = data.reduce((sum, item) => sum + item.totalRetailValue, 0);
  const potentialProfit = totalRetailValuation - totalCostValuation;

  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(
      (item) => item.name.toLowerCase().includes(q) || item.barcode.toLowerCase().includes(q)
    );
  }, [data, search]);

  const columns: ColumnDef<IStockReportItem>[] = [
    {
      accessorKey: "name",
      header: "Product Name",
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">{row.getValue("name")}</span>
          <span className="text-[10px] text-neutral-400 block font-mono">{row.original.barcode} • {row.original.categoryName}</span>
        </div>
      ),
    },
    {
      accessorKey: "currentStock",
      header: "Stock Qty",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <span className={`px-2 py-0.5 text-xs font-bold rounded ${item.isLowStock ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-700"}`}>
            {item.currentStock} {item.unitCode}
          </span>
        );
      },
    },
    {
      accessorKey: "costPrice",
      header: "Cost Price",
      cell: ({ row }) => <span className="font-mono">{currencySymbol}{row.original.costPrice.toFixed(2)}</span>,
    },
    {
      accessorKey: "sellingPrice",
      header: "Retail Price",
      cell: ({ row }) => <span className="font-mono font-bold text-blue-600">{currencySymbol}{row.original.sellingPrice.toFixed(2)}</span>,
    },
    {
      accessorKey: "totalCostValue",
      header: "Stock Cost Value",
      cell: ({ row }) => <span className="font-mono font-bold">{currencySymbol}{row.original.totalCostValue.toFixed(2)}</span>,
    },
    {
      accessorKey: "totalRetailValue",
      header: "Stock Retail Value",
      cell: ({ row }) => <span className="font-mono font-bold text-emerald-600">{currencySymbol}{row.original.totalRetailValue.toFixed(2)}</span>,
    },
  ];

  const table = useReactTable({ data: filteredData, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Reports & Financials" }, { label: "Stock Valuation Report" }]} />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            Product Stock Valuation (পণ্য মজুদ ও মূল্যায়ন)
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Real-time inventory valuation at cost price vs. retail selling price
          </p>
        </div>
      </div>

      {/* Summary Valuation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">Total Inventory Cost</span>
          <span className="text-2xl font-black text-neutral-900 dark:text-neutral-100 font-mono">
            {currencySymbol}{totalCostValuation.toFixed(2)}
          </span>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">Total Retail Valuation</span>
          <span className="text-2xl font-black text-emerald-600 font-mono">
            {currencySymbol}{totalRetailValuation.toFixed(2)}
          </span>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">Potential Gross Profit</span>
          <span className="text-2xl font-black text-blue-600 font-mono">
            {currencySymbol}{potentialProfit.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 rounded-2xl shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter stock by name or barcode..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none"
          />
        </div>
      </div>

      <DataTable table={table} columns={columns} />
    </div>
  );
}