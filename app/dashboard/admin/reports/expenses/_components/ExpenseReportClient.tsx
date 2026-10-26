"use client";

import { useState, useMemo } from "react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { ReceiptText, DollarSign, Wallet, CreditCard } from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";
import ExpenseReportFilters from "./ExpenseReportFilters";
import ExpenseExportActions from "./ExpenseExportActions";
import { getExpenseColumns } from "./Columns";
import ExpenseReportPdf from "./ExpenseReportPdf";
import { IExpenseReportKPIs, IExpenseReportRow, IExpenseCategoryStat } from "@/types/expenses";
import { ReportKpiCard } from "../../common/report-kpi-card";

interface Props {
  kpis: IExpenseReportKPIs;
  rows: IExpenseReportRow[];
  categoryStats: IExpenseCategoryStat[];
  currencySymbol: string;
  categories: { id: string; name: string }[];
  shop: { name: string; phone?: string | null; address?: string | null };
  branchName: string;
}

export default function ExpenseReportClient({
  kpis,
  rows = [],
  categoryStats = [],
  currencySymbol = "৳",
  categories,
  shop,
  branchName,
}: Props) {
  const [activeTab, setActiveTab] = useState<"vouchers" | "categories">("vouchers");

  // Stable column definitions
  const columns = useMemo(() => getExpenseColumns(currencySymbol), [currencySymbol]);

  // Stable data memoization
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      {/* Screen Dashboard */}
      <div className="print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">দোকানের যাবতীয় খরচ (Expense Analytics)</h1>
            <p className="text-xs text-neutral-500">Track petty cash outflows, recurring utilities, rent, and staff food costs</p>
          </div>

          <ExpenseExportActions rows={rows} />
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ReportKpiCard
            title="মোট দোকান খরচ (Total OPEX)"
            value={`${currencySymbol}${kpis.totalExpenseAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            subtitle="All expense categories"
            icon={ReceiptText}
            variant="danger"
          />
          <ReportKpiCard
            title="ক্যাশ ড্রয়ার থেকে ব্যয় (Cash)"
            value={`${currencySymbol}${kpis.cashExpenseAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            subtitle="Petty cash outflows"
            icon={Wallet}
            variant="warning"
          />
          <ReportKpiCard
            title="ব্যাংক ও ওয়ালেট ব্যয়"
            value={`${currencySymbol}${(kpis.bankExpenseAmount + kpis.otherMethodExpenseAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            subtitle="DBBL, bKash & Nagad"
            icon={CreditCard}
            variant="info"
          />
          <ReportKpiCard
            title="মোট ভাউচার সংখ্যা"
            value={`${kpis.totalVouchersCount} টি`}
            subtitle="Recorded entries"
            icon={DollarSign}
            variant="default"
          />
        </div>

        {/* Filter Strip */}
        <ExpenseReportFilters categories={categories} />

        {/* Sub-Tabs */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => setActiveTab("vouchers")}
            className={`px-4 py-2 text-xs font-semibold border-b-2 cursor-pointer transition ${
              activeTab === "vouchers"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-bold"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            খরচের ভাউচার তালিকা ({rows.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            className={`px-4 py-2 text-xs font-semibold border-b-2 cursor-pointer transition ${
              activeTab === "categories"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-bold"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            খাতভিত্তিক খরচ বিশ্লেষণ ({categoryStats.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "vouchers" ? (
          <DataTable table={table} columns={columns} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categoryStats.map((c) => (
              <div
                key={c.categoryId}
                className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-xs text-neutral-900 dark:text-neutral-100">{c.categoryName}</h3>
                    <span className="text-[10px] text-neutral-400 font-mono">{c.categoryCode} • {c.vouchersCount} Vouchers</span>
                  </div>
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                    {c.percentage}%
                  </span>
                </div>

                <div className="flex justify-between items-baseline pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <span className="text-xs text-neutral-400">মোট খরচ:</span>
                  <span className="text-sm font-black font-mono text-red-600 dark:text-red-400">
                    {currencySymbol}{c.totalAmount.toFixed(2)}
                  </span>
                </div>

                {/* Visual Progress Bar of Category Share */}
                <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${Math.min(c.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Printable A4 Physical Expense Sheet */}
      <ExpenseReportPdf
        kpis={kpis}
        rows={rows}
        categoryStats={categoryStats}
        currencySymbol={currencySymbol}
        shop={shop}
        branchName={branchName}
      />
    </div>
  );
}