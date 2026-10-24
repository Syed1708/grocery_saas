"use client";

import { 
  TrendingUp, 
  Users, 
  Boxes, 
  Truck, 
  PieChart, 
  ReceiptText, 
  ShieldCheck,
  ShoppingBag,
  DollarSign,
  AlertTriangle,
  CreditCard
} from "lucide-react";
import { ReportCategoryCard } from "./report-category-card";
import { IReportsOverviewStats } from "@/queries/reports-overview-queries";
import { ReportKpiCard } from "../common/report-kpi-card";

interface Props {
  stats: IReportsOverviewStats;
  currencySymbol: string;
}

export default function ReportsOverviewClient({ stats, currencySymbol }: Props) {
  return (
    <div className="space-y-6">
      {/* 1. Quick Business Health Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <ReportKpiCard
          title="Today's Total Sales"
          value={`${currencySymbol}${stats.todaySalesTotal.toFixed(2)}`}
          subtitle={`${stats.todayInvoicesCount} invoices issued today`}
          icon={ShoppingBag}
          variant="info"
        />
        <ReportKpiCard
          title="Today's Cash Inflow"
          value={`${currencySymbol}${stats.todayCollectedCash.toFixed(2)}`}
          subtitle="Collected at counter & POS"
          icon={DollarSign}
          variant="success"
        />
        <ReportKpiCard
          title="Total Customer Dues (বাকি)"
          value={`${currencySymbol}${stats.totalCustomerDue.toFixed(2)}`}
          subtitle="Uncollected Bakir Khata"
          icon={CreditCard}
          variant="danger"
        />
        <ReportKpiCard
          title="Low Stock Reorders"
          value={`${stats.lowStockItemsCount} Items`}
          subtitle="Running below alert buffer"
          icon={AlertTriangle}
          variant="warning"
        />
      </div>

      {/* 2. Interactive Report Hub Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-100 uppercase">
            Specialized Reporting Modules (সকল রিপোর্ট মডিউল)
          </h2>
          <span className="text-xs text-neutral-400">Select a module to view granular filters</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <ReportCategoryCard
            title="বিক্রয় ও ইনভয়েস রিপোর্ট"
            subtitleEn="Sales & Invoices Analytics"
            description="Item sales velocity, cashier performance, channel splits (bKash/Cash), and invoice ledger."
            href="/dashboard/admin/reports/sales"
            badge="Core POS"
            metricLabel="Today's Invoices"
            metricValue={`${stats.todayInvoicesCount} Slips`}
            icon={TrendingUp}
            colorScheme="blue"
          />

          <ReportCategoryCard
            title="কাস্টমার বাকি খাতা"
            subtitleEn="Customer Khata & Aging"
            description="Detailed customer balances, overdue aging buckets (30/60/90 days), and collections history."
            href="/dashboard/admin/reports/customers-due"
            badge="Recovery"
            metricLabel="Total Outstanding"
            metricValue={`${currencySymbol}${stats.totalCustomerDue.toFixed(2)}`}
            icon={Users}
            colorScheme="rose"
          />

          <ReportCategoryCard
            title="মজুদ পণ্য ও মেয়াদ রিপোর্ট"
            subtitleEn="Stock Valuation & Expiry"
            description="Current stock on hand, valuation at cost vs retail, perishable expiry warnings, and slow items."
            href="/dashboard/admin/reports/stock"
            badge="Inventory"
            metricLabel="Low Stock Alerts"
            metricValue={`${stats.lowStockItemsCount} Products`}
            icon={Boxes}
            colorScheme="amber"
          />

          <ReportCategoryCard
            title="ক্রয় ও মহাজন দেনা"
            subtitleEn="Purchases & Supplier Payables"
            description="Supplier chalans, wholesale purchase history, cost price fluctuations, and supplier dues."
            href="/dashboard/admin/reports/purchases"
            badge="Supply Chain"
            metricLabel="Payables Owed"
            metricValue={`${currencySymbol}${stats.totalSupplierDue.toFixed(2)}`}
            icon={Truck}
            colorScheme="indigo"
          />

          <ReportCategoryCard
            title="লাভ-ক্ষতি বিবরণী (P&L)"
            subtitleEn="Profit & Loss Statement"
            description="Gross profit by COGS margin, operating expenses deduction, and real net profit analysis."
            href="/dashboard/admin/reports/profit-loss"
            badge="Financials"
            metricLabel="Margin Engine"
            metricValue="Gross vs Net"
            icon={PieChart}
            colorScheme="emerald"
          />

          <ReportCategoryCard
            title="দোকানের যাবতীয় খরচ"
            subtitleEn="Operating Expenses Ledger"
            description="Category-wise overheads: electricity, rent, staff snacks, transportation, and daily petty cash."
            href="/dashboard/admin/reports/expenses"
            badge="OPEX"
            metricLabel="Today's Expenses"
            metricValue={`${currencySymbol}${stats.todayExpensesTotal.toFixed(2)}`}
            icon={ReceiptText}
            colorScheme="violet"
          />

          <ReportCategoryCard
            title="কাউন্টার ক্লোজিং (Z-Report)"
            subtitleEn="Day-End Cash Reconciliation"
            description="Shift cash drawer reconciliation, cashier shortage/surplus audit, and 80mm thermal slip print."
            href="/dashboard/admin/reports/closings"
            badge="Shift Audit"
            metricLabel="Register Safe"
            metricValue="Locked Audit"
            icon={ShieldCheck}
            colorScheme="cyan"
          />
        </div>
      </div>
    </div>
  );
}