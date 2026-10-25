"use client";

import { TrendingUp, DollarSign, PieChart, Wallet, Layers } from "lucide-react";
import ProfitLossFilters from "./ProfitLossFilters";
import ProfitLossExportActions from "./ProfitLossExportActions";
import ProfitLossPdf from "./ProfitLossPdf";
import { IProfitLossData } from "@/types/profit-loss";
import { ReportKpiCard } from "../../common/report-kpi-card";

interface Props {
  data: IProfitLossData;
  currencySymbol: string;
  shop: { name: string; phone?: string | null; address?: string | null };
  branchName: string;
}

export default function ProfitLossClient({
  data,
  currencySymbol = "৳",
  shop,
  branchName,
}: Props) {
  const isNetProfit = data.netProfit >= 0;

  return (
    <div className="space-y-4">
      {/* Screen Interface */}
      <div className="print:hidden space-y-4">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">লাভ-ক্ষতি বিবরণী (Profit & Loss Statement)</h1>
            <p className="text-xs text-neutral-500">Comprehensive gross margin, operating overheads, and net store profit</p>
          </div>

          <ProfitLossExportActions data={data} />
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <ReportKpiCard
            title="প্রকৃত বিক্রয় (Net Sales)"
            value={`${currencySymbol}${data.netSalesRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            subtitle="Gross turnover minus returns"
            icon={DollarSign}
            variant="default"
          />
          <ReportKpiCard
            title="পণ্যের ক্রয় খরচ (COGS)"
            value={`${currencySymbol}${data.netCogs.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            subtitle="Cost of items sold"
            icon={Layers}
            variant="warning"
          />
          <ReportKpiCard
            title="মোট লাভ (Gross Profit)"
            value={`${currencySymbol}${data.grossProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            subtitle={`মার্জিন: ${data.grossMarginPercent}%`}
            icon={TrendingUp}
            variant="info"
          />
          <ReportKpiCard
            title="দোকানের মোট খরচ (OPEX)"
            value={`${currencySymbol}${data.totalOpex.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            subtitle="Overheads, rent & payroll"
            icon={Wallet}
            variant="danger"
          />
          <ReportKpiCard
            title="প্রকৃত লাভ (Net Profit)"
            value={`${currencySymbol}${data.netProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            subtitle={`নেট মার্জিন: ${data.netMarginPercent}%`}
            icon={PieChart}
            variant={isNetProfit ? "success" : "danger"}
          />
        </div>

        {/* Date Filter Toolbar */}
        <ProfitLossFilters />

        {/* Structured Income Statement Card */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
          <h2 className="text-sm font-bold tracking-tight mb-4 uppercase text-neutral-700 dark:text-neutral-300">
            বিশদ লাভ-ক্ষতি হিসাব বিবরণী (Detailed Income Statement)
          </h2>

          <div className="space-y-6 text-xs">
            {/* 1. Revenue Section */}
            <div className="space-y-2">
              <div className="flex justify-between font-bold text-neutral-900 dark:text-neutral-100 border-b border-neutral-100 dark:border-neutral-800 pb-1">
                <span>১. বিক্রয় ও রাজস্ব আয় (Sales Revenue)</span>
                <span className="font-mono text-sm">{currencySymbol}{data.netSalesRevenue.toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-neutral-500 pl-3 text-[11px]">
                <div>মোট বিক্রয়: <strong className="font-mono text-neutral-800 dark:text-neutral-200">{currencySymbol}{data.grossSales.toFixed(2)}</strong></div>
                <div>বিক্রয় ছাড়: <strong className="font-mono text-red-600">-{currencySymbol}{data.salesDiscount.toFixed(2)}</strong></div>
                <div>পণ্য ফেরত: <strong className="font-mono text-red-600">-{currencySymbol}{data.salesReturns.toFixed(2)}</strong></div>
              </div>
            </div>

            {/* 2. COGS Section */}
            <div className="space-y-2">
              <div className="flex justify-between font-bold text-neutral-900 dark:text-neutral-100 border-b border-neutral-100 dark:border-neutral-800 pb-1">
                <span>২. বিক্রিত পণ্যের মোট ক্রয়মূল্য (Cost of Goods Sold - COGS)</span>
                <span className="font-mono text-sm text-red-600">-{currencySymbol}{data.netCogs.toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-neutral-500 pl-3 text-[11px]">
                <div>বিক্রিত আইটেমের মোট ক্রয়মূল্য: <strong className="font-mono text-neutral-800 dark:text-neutral-200">{currencySymbol}{data.cogsAmount.toFixed(2)}</strong></div>
                <div>রিস্টক পণ্য ফেরত সমন্বয়: <strong className="font-mono text-emerald-600">-{currencySymbol}{data.cogsRestockAdjustment.toFixed(2)}</strong></div>
              </div>
            </div>

            {/* Gross Profit Highlight */}
            <div className="p-3 bg-blue-50/60 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 flex justify-between items-center font-bold">
              <div>
                <span className="text-blue-900 dark:text-blue-300 block text-xs">মোট লাভ (Gross Profit)</span>
                <span className="text-[10px] text-blue-700/80 dark:text-blue-400 font-medium">বিক্রয় মার্জিন: {data.grossMarginPercent}%</span>
              </div>
              <span className="text-base font-black font-mono text-blue-700 dark:text-blue-400">
                {currencySymbol}{data.grossProfit.toFixed(2)}
              </span>
            </div>

            {/* 3. Operating Expenses Section */}
            <div className="space-y-2">
              <div className="flex justify-between font-bold text-neutral-900 dark:text-neutral-100 border-b border-neutral-100 dark:border-neutral-800 pb-1">
                <span>৩. দোকান পরিচালন ব্যয় (Operating Expenses - OPEX)</span>
                <span className="font-mono text-sm text-red-600">-{currencySymbol}{data.totalOpex.toFixed(2)}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pl-3 pt-1">
                {data.expenseCategories.map((c) => (
                  <div key={c.categoryId} className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 text-[11px]">
                    <span className="text-neutral-400 block text-[10px]">{c.categoryName}</span>
                    <strong className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                      {currencySymbol}{c.totalAmount.toFixed(2)}
                    </strong>
                  </div>
                ))}
                <div className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 text-[11px]">
                  <span className="text-neutral-400 block text-[10px]">স্টাফ বেতন (Staff Payroll)</span>
                  <strong className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                    {currencySymbol}{data.payrollExpenses.toFixed(2)}
                  </strong>
                </div>
                <div className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 text-[11px]">
                  <span className="text-neutral-400 block text-[10px]">নষ্ট পণ্যের ক্ষতি (Damaged)</span>
                  <strong className="font-mono font-bold text-red-600">
                    {currencySymbol}{data.damagedGoodsLoss.toFixed(2)}
                  </strong>
                </div>
              </div>
            </div>

            {/* 4. Other Income */}
            {data.otherIncome > 0 && (
              <div className="flex justify-between font-bold text-neutral-900 dark:text-neutral-100 border-b border-neutral-100 dark:border-neutral-800 pb-1">
                <span>৪. অন্যান্য ব্যবসায়িক আয় (Other Non-Operating Income)</span>
                <span className="font-mono text-emerald-600">+{currencySymbol}{data.otherIncome.toFixed(2)}</span>
              </div>
            )}

            {/* Net Profit Banner */}
            <div
              className={`p-4 rounded-xl border flex justify-between items-center ${
                isNetProfit
                  ? "bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300"
                  : "bg-red-50/70 border-red-200 text-red-900 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300"
              }`}
            >
              <div>
                <span className="text-sm font-extrabold block">
                  {isNetProfit ? "সর্বমোট প্রকৃত লাভ (Net Profit)" : "সর্বমোট নিট লোকসান (Net Loss)"}
                </span>
                <span className="text-[11px] font-semibold opacity-80">
                  নিট মুনাফা মার্জিন: {data.netMarginPercent}%
                </span>
              </div>
              <span className="text-2xl font-black font-mono">
                {currencySymbol}{data.netProfit.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Printable A4 Income Statement */}
      <ProfitLossPdf
        data={data}
        currencySymbol={currencySymbol}
        shop={shop}
        branchName={branchName}
      />
    </div>
  );
}