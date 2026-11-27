"use client";

import { useState, useMemo } from "react";
import { flushSync } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Truck, DollarSign, Wallet, CreditCard, Percent } from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";
import PurchaseReportFilters from "./PurchaseReportFilters";
import PurchaseExportActions from "./PurchaseExportActions";
import PurchaseDetailsModal from "./PurchaseDetailsModal";
import { getPurchaseColumns } from "./Columns";
import PurchaseReportPdf from "./PurchaseReportPdf";
import { IPurchaseFilterParams, IPurchaseReportKPIs, IPurchaseReportRow } from "@/types/purchases";
import { fetchPurchaseReportRowsAction } from "@/app/actions/purchase-report-actions";
import { ReportKpiCard } from "../../common/report-kpi-card";

interface Props {
  kpis: IPurchaseReportKPIs;
  rows: IPurchaseReportRow[];
  rowsTotal: number;
  dueTotal: number;
  page: number;
  pageSize: number;
  filters: IPurchaseFilterParams;
  currencySymbol: string;
  suppliers: { id: string; name: string; companyName: string | null }[];
  shop: { name: string; phone?: string | null; address?: string | null };
  branchName: string;
}

export default function PurchaseReportClient({
  kpis,
  rows = [],
  rowsTotal,
  dueTotal,
  page,
  pageSize,
  filters,
  currencySymbol = "৳",
  suppliers,
  shop,
  branchName,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") === "due" ? "due" : "all";
  const [selectedChalan, setSelectedChalan] = useState<IPurchaseReportRow | null>(null);
  const [exportRows, setExportRows] = useState<IPurchaseReportRow[] | null>(null);

  const setActiveTab = (tab: "all" | "due") => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "due") params.set("tab", "due");
    else params.delete("tab");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const updatePagination = (nextPage: number, nextPageSize: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPageSize !== pageSize) {
      params.set("pageSize", String(nextPageSize));
      params.delete("page");
    } else if (nextPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const loadAllRows = async (): Promise<IPurchaseReportRow[] | null> => {
    const result = await fetchPurchaseReportRowsAction(filters, activeTab === "due");
    if (!result.success) {
      toast.error(result.error);
      return null;
    }
    return result.data;
  };

  const handlePrintRows = (allRows: IPurchaseReportRow[]) => {
    flushSync(() => setExportRows(allRows));
    requestAnimationFrame(() => {
      setTimeout(() => window.print(), 80);
    });
  };

  // Stable column definition
  const columns = useMemo(
    () => getPurchaseColumns(currencySymbol, (chalan) => setSelectedChalan(chalan)),
    [currencySymbol]
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.max(1, Math.ceil(rowsTotal / pageSize)),
    state: { pagination: { pageIndex: page - 1, pageSize } },
    onPaginationChange: (updater) => {
      const current = { pageIndex: page - 1, pageSize };
      const next = typeof updater === "function" ? updater(current) : updater;
      updatePagination(next.pageIndex + 1, next.pageSize);
    },
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

          <PurchaseExportActions getRows={loadAllRows} onPrintRows={handlePrintRows} />
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
            সকল ক্রয় চালান ({kpis.totalChalansCount})
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
            🛑 বকেয়া দেনা চালান ({dueTotal})
          </button>
        </div>

        <DataTable table={table} columns={columns} totalCount={rowsTotal} />
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
        rows={exportRows ?? rows}
        currencySymbol={currencySymbol}
        shop={shop}
        branchName={branchName}
      />
    </div>
  );
}