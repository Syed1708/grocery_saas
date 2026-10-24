"use client";

import { useState, useMemo } from "react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Boxes, DollarSign, TrendingUp, AlertTriangle, Clock } from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";
import StockReportFilters from "./StockReportFilters";
import StockExportActions from "./StockExportActions";
import { getStockColumns } from "./Columns";
import StockValuationPdf from "./StockValuationPdf";
import { IStockReportKPIs, IStockReportRow } from "@/types/stock";
import { ReportKpiCard } from "../../common/report-kpi-card";

interface Props {
  kpis: IStockReportKPIs;
  rows: IStockReportRow[];
  currencySymbol: string;
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
  sections: { id: string; name: string; code: string | null }[];
  shop: { name: string; phone?: string | null; address?: string | null };
  branchName: string;
}

export default function StockReportClient({
  kpis,
  rows = [],
  currencySymbol = "৳",
  categories,
  brands,
  sections,
  shop,
  branchName,
}: Props) {
  const [activeTab, setActiveTab] = useState<"all" | "low" | "expiring">("all");

  //  1. Memoize filtered data so TanStack Table reference remains stable
  const filteredData = useMemo(() => {
    if (!Array.isArray(rows)) return [];
    if (activeTab === "low") {
      return rows.filter((r) => r.stockStatus === "LOW_STOCK" || r.stockStatus === "OUT_OF_STOCK");
    }
    if (activeTab === "expiring") {
      return rows.filter((r) => r.expiryStatus === "EXPIRING_SOON" || r.expiryStatus === "EXPIRED");
    }
    return rows;
  }, [activeTab, rows]);

  //  2. Memoize columns definition
  const columns = useMemo(() => getStockColumns(currencySymbol), [currencySymbol]);

  //  3. TanStack Table with stable memoized inputs
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      {/* Screen Interface */}
      <div className="print:hidden space-y-4">
        {/* Header Bar with Action Exports */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">মজুদ পণ্য ও মেয়াদ রিপোর্ট (Stock Valuation)</h1>
            <p className="text-xs text-neutral-500">Live inventory valuation, shelf tracking, and perishable expiry watch</p>
          </div>

          {/* Export Actions: Excel CSV & A4 Print */}
          <StockExportActions rows={filteredData} />
        </div>

        {/* KPI Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <ReportKpiCard
            title="ক্রয় মূল্যে মোট মজুদ"
            value={`${currencySymbol}${(kpis?.totalCostValue || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            subtitle="Capital tied in stock"
            icon={DollarSign}
            variant="default"
          />
          <ReportKpiCard
            title="বিক্রয় মূল্যে মোট মজুদ"
            value={`${currencySymbol}${(kpis?.totalRetailValue || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            subtitle="Expected sales turnover"
            icon={TrendingUp}
            variant="info"
          />
          <ReportKpiCard
            title="প্রত্যাশিত মোট লাভ"
            value={`${currencySymbol}${(kpis?.potentialGrossProfit || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            subtitle="Unrealized gross profit"
            icon={Boxes}
            variant="success"
          />
          <ReportKpiCard
            title="লো স্টক পণ্য"
            value={`${kpis?.lowStockItemsCount || 0} টি`}
            subtitle="Below safety buffer"
            icon={AlertTriangle}
            variant="warning"
          />
          <ReportKpiCard
            title="মেয়াদোত্তীর্ণের পথে"
            value={`${kpis?.expiringSoonCount || 0} টি`}
            subtitle="Expiring in ≤ 30 days"
            icon={Clock}
            variant="danger"
          />
        </div>

        {/* Filter Strip */}
        <StockReportFilters categories={categories} brands={brands} sections={sections} />

        {/* Sub-Tabs */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 text-xs font-semibold border-b-2 cursor-pointer transition ${
              activeTab === "all"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-bold"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            সকল মজুদ পণ্য ({rows.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("low")}
            className={`px-4 py-2 text-xs font-semibold border-b-2 cursor-pointer transition ${
              activeTab === "low"
                ? "border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400 font-bold"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            ⚠️ লো স্টক অ্যালার্ট ({kpis?.lowStockItemsCount || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("expiring")}
            className={`px-4 py-2 text-xs font-semibold border-b-2 cursor-pointer transition ${
              activeTab === "expiring"
                ? "border-red-600 text-red-600 dark:border-red-400 dark:text-red-400 font-bold"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            🛑 মেয়াদোত্তীর্ণ সতর্কতা ({(kpis?.expiringSoonCount || 0) + (kpis?.expiredCount || 0)})
          </button>
        </div>

        {/* Data Table */}
        <DataTable table={table} columns={columns} />
      </div>

      {/* Printable A4 Physical Stock Sheet */}
      <StockValuationPdf
        kpis={kpis}
        rows={filteredData}
        currencySymbol={currencySymbol}
        shop={shop}
        branchName={branchName}
      />
    </div>
  );
}