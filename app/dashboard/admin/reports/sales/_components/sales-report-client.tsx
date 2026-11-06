// app/(dashboard)/reports/sales/_components/sales-report-client.tsx
"use client";
"use no memo";

import { useState } from "react";
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { 
  DollarSign, 
  Wallet, 
  CreditCard, 
  ShoppingBag, 
  Layers, 
  Percent, 
  Printer,
  Download,
  Store,
} from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";
import Breadcrumbs from "@/components/common/Breadcrumbs";
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
  userRole?: string;
}

export default function SalesReportClient({
  kpis,
  invoices = [],
  itemVelocity = [],
  currencySymbol = "৳",
  filters,
  shop,
  branchName = "Main Branch",
  userRole = "OWNER",
}: Props) {
  const [activeTab, setActiveTab] = useState<"invoices" | "items">("invoices");

  // 🛡️ Privacy Check: Only Owners & Managers can inspect net profit margins
  const canViewMargins = userRole === "OWNER" || userRole === "MANAGER";

  // Table Setup with safe pagination
  const invoiceColumns = getSalesReportColumns(currencySymbol);
  const invoiceTable = useReactTable({
    data: invoices,
    columns: invoiceColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const itemColumns = getItemVelocityColumns(currencySymbol, canViewMargins);
  const itemTable = useReactTable({
    data: itemVelocity,
    columns: itemColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handlePrintPdf = () => {
    window.print();
  };

  // 📊 Multi-Tab CSV Export Engine
 // 📊 Multi-Tab CSV Export Engine (Typesafe)
  const handleExportCSV = () => {
    if (activeTab === "invoices") {
      if (invoices.length === 0) return;
      const headers = ["Invoice #", "Date", "Customer", "Subtotal", "Discount", "Grand Total", "Paid", "Due", "Payment Method", "Status"];
      const rows = invoices.map((inv) => [
        `"#${inv.invoiceNo}"`,
        `"${new Date(inv.saleDate).toLocaleDateString()}"`,
        `"${inv.customerName || "Walk-in"}"`,
        inv.subtotal.toFixed(2),
        inv.discount.toFixed(2),
        inv.grandTotal.toFixed(2),
        inv.paidAmount.toFixed(2),
        inv.dueAmount.toFixed(2),
        `"${inv.paymentMethod}"`,
        `"${inv.paymentStatus}"`,
      ]);

      downloadCSV(headers, rows, `Sales_Invoices_Report_${branchName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}`);
    } else {
      if (itemVelocity.length === 0) return;

      const headers = [
        "Product Name",
        "Barcode",
        "Quantity Sold",
        "Total Revenue",
        ...(canViewMargins ? ["Gross Profit", "Margin %"] : []),
      ];

      // 👈 FIX: Uses exact IItemVelocityRow property names (productName, totalQuantity, marginPercent)
      const rows = itemVelocity.map((item) => [
        `"${item.productName}"`,
        `"${item.barcode}"`,
        item.totalQuantity.toFixed(2),
        item.totalRevenue.toFixed(2),
        ...(canViewMargins ? [item.totalProfit.toFixed(2), `${item.marginPercent}%`] : []),
      ]);

      downloadCSV(headers, rows, `Item_Velocity_Report_${branchName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}`);
    }
  };

  const downloadCSV = (headers: string[], rows: any[][], fileName: string) => {
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Interactive Screen Dashboard (Hidden during print) */}
      <div className="print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <Breadcrumbs items={[{ label: "রিপোর্ট হাব", href: "/reports" }, { label: "বিক্রয় ও রাজস্ব বিবরণী" }]} />
            <div className="flex items-center gap-2 mt-1">
              <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                বিক্রয় ও রাজস্ব বিবরণী (Sales & Revenue)
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                <Store size={11} /> শাখা: {branchName}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">দৈনিক মোট বিক্রয়, নগদ সংগ্রহ, বাকি এবং পণ্যভিত্তিক গতিশীলতা ও লাভ পর্যালোচনা</p>
          </div>
          
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition cursor-pointer shadow-xs"
            >
              <Download size={14} /> এক্সেল ডাউনলোড (CSV)
            </button>
            <button
              type="button"
              onClick={handlePrintPdf}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition cursor-pointer"
            >
              <Printer size={15} /> A4 প্রিন্ট / PDF
            </button>
          </div>
        </div>

        {/* Reusable KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <ReportKpiCard title="নিট বিক্রয় (Net Sales)" value={`${currencySymbol}${kpis.totalNetSales.toFixed(2)}`} icon={DollarSign} variant="info" />
          <ReportKpiCard title="নগদ সংগ্রহ (Cash)" value={`${currencySymbol}${kpis.totalCashCollected.toFixed(2)}`} icon={Wallet} variant="success" />
          <ReportKpiCard title="অনাদায়ী বাকি (Due)" value={`${currencySymbol}${kpis.totalDueOutstanding.toFixed(2)}`} icon={CreditCard} variant="danger" />
          <ReportKpiCard title="মোট ছাড় (Discounts)" value={`${currencySymbol}${kpis.totalDiscount.toFixed(2)}`} icon={Percent} variant="warning" />
          <ReportKpiCard title="মোট ইনভয়েস" value={kpis.totalInvoices.toString()} icon={ShoppingBag} />
          <ReportKpiCard title="গ্রস সাবটোটাল" value={`${currencySymbol}${kpis.totalGrossSales.toFixed(2)}`} icon={Layers} />
        </div>

        {/* Filter Bar */}
        <SalesReportFilters />

        {/* Tab Switcher */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => setActiveTab("invoices")}
            className={`px-4 py-2 text-xs font-bold border-b-2 cursor-pointer transition ${
              activeTab === "invoices"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            চালান বিবরণী (Invoices: {invoices.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("items")}
            className={`px-4 py-2 text-xs font-bold border-b-2 cursor-pointer transition ${
              activeTab === "items"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            পণ্যভিত্তিক বিক্রয় ও লাভ (Product Velocity: {itemVelocity.length})
          </button>
        </div>

        {/* Render Active Table */}
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