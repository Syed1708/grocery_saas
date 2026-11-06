// app/(dashboard)/reports/stock/_components/stock-report-client.tsx
"use client";
"use no memo";

import { useState, useMemo } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  DollarSign,
  TrendingUp,
  Boxes,
  AlertTriangle,
  Clock,
  Store,
} from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { IStockReportKPIs, IStockReportRow } from "@/types/stock";
import { ReportKpiCard } from "../../common/report-kpi-card";
import { getStockColumns } from "./Columns";
import StockExportActions from "./StockExportActions";
import StockReportFilters from "./StockReportFilters";
import StockValuationPdf from "./StockValuationPdf";

interface Props {
  kpis: IStockReportKPIs;
  rows: IStockReportRow[];
  currencySymbol: string;
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
  sections: { id: string; name: string; code: string | null }[];
  shop: { name: string; phone?: string | null; address?: string | null };
  branchName: string;
  userRole?: string;
}

export default function StockReportClient({
  kpis,
  rows = [],
  currencySymbol = "৳",
  categories,
  brands,
  sections,
  shop,
  branchName = "Main Branch",
  userRole = "OWNER",
}: Props) {
  const [activeTab, setActiveTab] = useState<"all" | "low" | "expiring">("all");

  // 🛡️ Privacy Guard: Only Owners and Managers can see capital tied in stock and profit margins
  const canViewCost = userRole === "OWNER" || userRole === "MANAGER";

  // 1. Stable memoized filtered rows per sub-tab
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

  // 2. Memoized columns with role-based cost protection
  const columns = useMemo(() => getStockColumns(currencySymbol, canViewCost), [currencySymbol, canViewCost]);

  // 3. TanStack Table with safe pagination
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(), // 👈 FIX: Prevents rendering thousands of rows at once!
  });

  return (
    <div className="space-y-4">
      {/* Screen Interface (Hidden in Print) */}
      <div className="print:hidden space-y-4">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <Breadcrumbs items={[{ label: "রিপোর্ট হাব", href: "/reports" }, { label: "মজুদ পণ্য ও মেয়াদ অডিট" }]} />
            <div className="flex items-center gap-2 mt-1">
              <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                মজুদ পণ্য ও মেয়াদ রিপোর্ট (Stock Valuation)
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                <Store size={11} /> শাখা: {branchName}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">রিয়েলটাইম ইনভেন্টরি ভ্যালুয়েশন, শেলফ ট্র্যাকিং ও মেয়াদোত্তীর্ণ পণ্যের নজরদারি</p>
          </div>

          {/* Export Actions: Excel CSV & A4 Print */}
          <StockExportActions rows={filteredData} />
        </div>

        {/* KPI Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {canViewCost && (
            <ReportKpiCard
              title="ক্রয় মূল্যে মোট মজুদ"
              value={`${currencySymbol}${(kpis?.totalCostValue || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
              subtitle="স্টকে আটকে থাকা মূলধন"
              icon={DollarSign}
              variant="default"
            />
          )}
          <ReportKpiCard
            title="বিক্রয় মূল্যে মোট মজুদ"
            value={`${currencySymbol}${(kpis?.totalRetailValue || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            subtitle="প্রত্যাশিত বিক্রয় টার্নওভার"
            icon={TrendingUp}
            variant="info"
          />
          {canViewCost && (
            <ReportKpiCard
              title="প্রত্যাশিত মোট লাভ"
              value={`${currencySymbol}${(kpis?.potentialGrossProfit || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
              subtitle="সম্ভাব্য গ্রস প্রফিট"
              icon={Boxes}
              variant="success"
            />
          )}
          <ReportKpiCard
            title="লো স্টক ও খালি পণ্য"
            value={`${kpis?.lowStockItemsCount || 0} টি`}
            subtitle="রি-অর্ডার সীমার নিচে"
            icon={AlertTriangle}
            variant="warning"
          />
          <ReportKpiCard
            title="মেয়াদোত্তীর্ণের পথে"
            value={`${kpis?.expiringSoonCount || 0} টি`}
            subtitle="মেয়াদ ≤ ৩০ দিন অবশিষ্ট"
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

        {/* Data Table with Pagination */}
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