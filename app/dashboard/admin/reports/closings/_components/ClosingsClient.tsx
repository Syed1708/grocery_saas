"use client";

import { useState, useMemo } from "react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { ShieldCheck, Plus, DollarSign, Wallet, AlertCircle } from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";
import { getClosingColumns } from "./Columns";
import ClosingFormModal from "./ClosingFormModal";
import ZReportSlip from "./ZReportSlip";
import { ICashRegisterClosing, ICurrentShiftSummary } from "@/types/closing";
import { ReportKpiCard } from "../../common/report-kpi-card";

interface Props {
  data: ICashRegisterClosing[];
  shiftSummary: ICurrentShiftSummary;
  currencySymbol?: string;
  shop: { name: string; phone?: string | null; address?: string | null };
  branchName: string;
}

export default function ClosingsClient({
  data = [],
  shiftSummary,
  currencySymbol = "৳",
  shop,
  branchName,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<ICashRegisterClosing | null>(null);

  const handlePrint = (closing: ICashRegisterClosing) => {
    setActiveReceipt(closing);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Stable TanStack Table memoization
  const columns = useMemo(() => getClosingColumns(currencySymbol, handlePrint), [currencySymbol]);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      {/* Screen Interface */}
      <div className="space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">কাউন্টার ক্লোজিং (Day-End Z-Report)</h1>
            <p className="text-xs text-neutral-500">Reconcile cash drawer float, commit shift closure, and print 80mm Z-slips</p>
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto"
          >
            <Plus size={15} /> নতুন ক্লোজিং সম্পাদন করুন
          </button>
        </div>

        {/* Live Shift KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ReportKpiCard
            title="ড্রয়ারে প্রত্যাশিত ক্যাশ"
            value={`${currencySymbol}${shiftSummary.expectedCash.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            subtitle="Current live drawer float"
            icon={DollarSign}
            variant="info"
          />
          <ReportKpiCard
            title="চলতি শিফট বিক্রয়"
            value={`${currencySymbol}${shiftSummary.cashSales.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            subtitle={`${shiftSummary.totalInvoices} slips since last close`}
            icon={Wallet}
            variant="success"
          />
          <ReportKpiCard
            title="শিফট খরচ ও পরিশোধ"
            value={`${currencySymbol}${(shiftSummary.cashExpenses + shiftSummary.cashSupplierPaid).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            subtitle="Cash payouts this shift"
            icon={AlertCircle}
            variant="warning"
          />
          <ReportKpiCard
            title="পূর্ববর্তী ক্লোজিং সংখ্যা"
            value={`${data.length} টি`}
            subtitle="Historical shift records"
            icon={ShieldCheck}
            variant="default"
          />
        </div>

        {/* Closings Ledger Table */}
        <DataTable table={table} columns={columns} />

        {/* Closing Calculator Modal */}
        <ClosingFormModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          summary={shiftSummary}
          currencySymbol={currencySymbol}
        />
      </div>

      {/* 80mm Thermal Receipt */}
      {activeReceipt && (
        <ZReportSlip
          closing={activeReceipt}
          currency={currencySymbol}
          shop={shop}
          branchName={branchName}
        />
      )}
    </div>
  );
}