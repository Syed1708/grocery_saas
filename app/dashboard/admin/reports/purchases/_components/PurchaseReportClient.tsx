"use client";

import { useState, useMemo } from "react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Truck, DollarSign, Wallet, CreditCard, Percent } from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";
import PurchaseReportFilters from "./PurchaseReportFilters";
import PurchaseExportActions from "./PurchaseExportActions";
import PurchaseDetailsModal from "./PurchaseDetailsModal";
import { getPurchaseColumns } from "./Columns";
import PurchaseReportPdf from "./PurchaseReportPdf";
import { IPurchaseReportKPIs, IPurchaseReportRow } from "@/types/purchases";
import { ReportKpiCard } from "../../common/report-kpi-card";

interface Props {
  kpis: IPurchaseReportKPIs;
  rows: IPurchaseReportRow[];
  currencySymbol: string;
  suppliers: { id: string; name: string; companyName: string | null }[];
  shop: { name: string; phone?: string | null; address?: string | null };
  branchName: string;
}

export default function PurchaseReportClient({
  kpis,
  rows = [],
  currencySymbol = "৳",
  suppliers,
  shop,
  branchName,
}: Props) {
  const [activeTab, setActiveTab] = useState<"all" | "due">("all");
  const [selectedChalan, setSelectedChalan] = useState<IPurchaseReportRow | null>(null);

  // Stable data memoization
  const filteredData = useMemo(() => {
    if (!Array.isArray(rows)) return [];
    if (activeTab === "due") {
      return rows.filter((r) => r.dueAmount > 0);
    }
    return rows;
  }, [activeTab, rows]);

  // Stable column definition
  const columns = useMemo(
    () => getPurchaseColumns(currencySymbol, (chalan) => setSelectedChalan(chalan)),
    [currencySymbol]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="print:hidden space-y-4">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">পণ্য ক্রয় ও চালান রিপোর্ট (Purchases & Dues)</h1>
            <p className="text-xs text-neutral-500">Track wholesale distributor chalans, supplier dues, and cash outflows</p>
          </div>

          <PurchaseExportActions rows={filteredData} />
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <ReportKpiCard
            title="মোট ক্রয় মান (Purchases)"
            value={`${currencySymbol}${kpis.totalPurchasesAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            subtitle="Wholesale purchases"
            icon={Truck}
            variant="default"
          />
          <ReportKpiCard
            title="নগদ পরিশোধ (Paid)"
            value={`${currencySymbol}${kpis.totalPaidAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            subtitle="Disbursed to suppliers"
            icon={Wallet}
            variant="success"
          />
          <ReportKpiCard
            title="বকেয়া দেনা (Payables Due)"
            value={`${currencySymbol}${kpis.totalDueAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            subtitle="Unpaid supplier credit"
            icon={CreditCard}
            variant="danger"
          />
          <ReportKpiCard
            title="ছাড় / ডিসকাউন্ট"
            value={`${currencySymbol}${kpis.totalDiscountAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            subtitle="Supplier commissions"
            icon={Percent}
            variant="warning"
          />
          <ReportKpiCard
            title="মোট চালান সংখ্যা"
            value={`${kpis.totalChalansCount} টি`}
            subtitle="Chalan vouchers"
            icon={DollarSign}
            variant="info"
          />
        </div>

        {/* Filter Strip */}
        <PurchaseReportFilters suppliers={suppliers} />

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
            সকল ক্রয় চালান ({rows.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("due")}
            className={`px-4 py-2 text-xs font-semibold border-b-2 cursor-pointer transition ${
              activeTab === "due"
                ? "border-red-600 text-red-600 dark:border-red-400 dark:text-red-400 font-bold"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            🛑 বকেয়া দেনা চালান ({rows.filter((r) => r.dueAmount > 0).length})
          </button>
        </div>

        <DataTable table={table} columns={columns} />
      </div>

      {/* Modal for Chalan Line Items */}
      {selectedChalan && (
        <PurchaseDetailsModal
          chalan={selectedChalan}
          currencySymbol={currencySymbol}
          onClose={() => setSelectedChalan(null)}
        />
      )}

      {/* Printable A4 PDF Sheet */}
      <PurchaseReportPdf
        kpis={kpis}
        rows={filteredData}
        currencySymbol={currencySymbol}
        shop={shop}
        branchName={branchName}
      />
    </div>
  );
}