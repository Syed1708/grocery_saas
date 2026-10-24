"use client";

import { useState } from "react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { 
  DollarSign, 
  Wallet, 
  CreditCard, 
  ShoppingBag, 
  Layers, 
  Percent, 
  Printer 
} from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";
import { SalesReportFilters } from "./sales-report-filters";
import { getSalesReportColumns } from "./columns";
import { getItemVelocityColumns } from "./item-velocity-columns";
import SalesReportPdfDocument from "./sales-report-pdf-document";
import { ISalesReportKPIs, ISaleReportRow, IItemVelocityRow, ISalesFilterParams } from "@/types/index";
import { ReportKpiCard } from "../../common/report-kpi-card";

interface Props {
  kpis: ISalesReportKPIs;
  invoices: ISaleReportRow[];
  itemVelocity: IItemVelocityRow[];
  currencySymbol: string;
  filters: ISalesFilterParams;
  shop: {
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    binVatNumber?: string | null;
    tradeLicense?: string | null;
  };
  branchName: string;
}

export default function SalesReportClient({
  kpis,
  invoices,
  itemVelocity,
  currencySymbol,
  filters,
  shop,
  branchName,
}: Props) {
  const [activeTab, setActiveTab] = useState<"invoices" | "items">("invoices");

  const invoiceColumns = getSalesReportColumns(currencySymbol);
  const invoiceTable = useReactTable({ data: invoices, columns: invoiceColumns, getCoreRowModel: getCoreRowModel() });

  const itemColumns = getItemVelocityColumns(currencySymbol);
  const itemTable = useReactTable({ data: itemVelocity, columns: itemColumns, getCoreRowModel: getCoreRowModel() });

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Interactive Screen Dashboard (Hidden in PDF Print) */}
      <div className="print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Sales & Revenue Reports</h1>
            <p className="text-xs text-neutral-500">Monitor daily sales, collection rates, dues, and item profit margins</p>
          </div>
          
          <button
            onClick={handlePrintPdf}
            className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 dark:text-neutral-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto"
          >
            <Printer size={15} /> Export / Print A4 PDF
          </button>
        </div>

        {/* Reusable KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <ReportKpiCard title="Net Sales" value={`${currencySymbol}${kpis.totalNetSales.toFixed(2)}`} icon={DollarSign} variant="info" />
          <ReportKpiCard title="Collected Cash" value={`${currencySymbol}${kpis.totalCashCollected.toFixed(2)}`} icon={Wallet} variant="success" />
          <ReportKpiCard title="Outstanding Due" value={`${currencySymbol}${kpis.totalDueOutstanding.toFixed(2)}`} icon={CreditCard} variant="danger" />
          <ReportKpiCard title="Discounts" value={`${currencySymbol}${kpis.totalDiscount.toFixed(2)}`} icon={Percent} variant="warning" />
          <ReportKpiCard title="Invoices" value={kpis.totalInvoices.toString()} icon={ShoppingBag} />
          <ReportKpiCard title="Gross Subtotal" value={`${currencySymbol}${kpis.totalGrossSales.toFixed(2)}`} icon={Layers} />
        </div>

        {/* Filter Bar */}
        <SalesReportFilters />

        {/* Tab Switcher */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => setActiveTab("invoices")}
            className={`px-4 py-2 text-xs font-semibold border-b-2 cursor-pointer transition ${
              activeTab === "invoices"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            Invoice Details ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab("items")}
            className={`px-4 py-2 text-xs font-semibold border-b-2 cursor-pointer transition ${
              activeTab === "items"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            Top Product Velocity & Margins ({itemVelocity.length})
          </button>
        </div>

        {/* Render Tab Table */}
        {activeTab === "invoices" ? (
          <DataTable table={invoiceTable} columns={invoiceColumns} />
        ) : (
          <DataTable table={itemTable} columns={itemColumns} />
        )}
      </div>

      {/* Official A4 PDF Document Element */}
      <SalesReportPdfDocument
        kpis={kpis}
        invoices={invoices}
        currencySymbol={currencySymbol}
        filters={filters}
        shop={shop}
        branchName={branchName}
      />
    </div>
  );
}