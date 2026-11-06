"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Users, AlertTriangle, ShieldAlert, CreditCard, Download, Printer, Store } from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { getCustomerDueColumns } from "./columns";
import CustomerKhataModal from "./customer-khata-modal";
import { ICustomerDueKPIs, ICustomerDueRow } from "@/types/index";
import { ReportKpiCard } from "../../common/report-kpi-card";

interface Props {
  kpis: ICustomerDueKPIs;
  customers: ICustomerDueRow[];
  currencySymbol: string;
  shopName: string;
  branchName?: string;
}

export default function CustomersDueClient({
  kpis,
  customers = [],
  currencySymbol = "৳",
  shopName,
  branchName = "Main Branch", // 👈 Now actively used in header badge, CSV export & modal
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeCustomer, setActiveCustomer] = useState<ICustomerDueRow | null>(null);

  // Search debounce state
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(() => {
      const currentQuery = searchParams.get("search") || "";
      if (searchInput !== currentQuery) {
        const params = new URLSearchParams(searchParams.toString());
        if (searchInput.trim()) {
          params.set("search", searchInput.trim());
        } else {
          params.delete("search");
        }
        router.push(`${pathname}?${params.toString()}`);
      }
    }, 350);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchInput, pathname, router, searchParams]);

  const handleFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  };

  // 👈 FIX: Typesafe CSV Export without undefined properties
  const handleExportCSV = () => {
    if (customers.length === 0) return;

    const headers = ["Customer Name", "Phone", "Customer Type", "Village / Address", "Total Due", "Credit Limit", "Status"];
    const rows = customers.map((c) => {
      const isOverdue = (c.overdueDays || 0) > 30;
      const isExceeded = c.currentDue > c.creditLimit;
      const statusLabel = isExceeded ? "Credit Exceeded" : isOverdue ? "30+ Days Overdue" : "Normal";
      const location = c.village || c.address || "N/A";

      return [
        `"${c.name}"`,
        `"${c.phone || "N/A"}"`,
        `"${c.type}"`,
        `"${location}"`,
        c.currentDue.toFixed(2),
        c.creditLimit.toFixed(2),
        `"${statusLabel}"`,
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Customer_Due_Report_${branchName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = getCustomerDueColumns(currencySymbol, (c) => setActiveCustomer(c));
  const table = useReactTable({ data: customers, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="space-y-4">
      {/* Header with Active Branch Badge */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <Breadcrumbs items={[{ label: "রিপোর্ট হাব", href: "/reports" }, { label: "কাস্টমার বাকি ও খাতা এজিং" }]} />
          {/* 👈 FIX: Uses branchName to display the active outlet badge */}
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <Store size={11} /> শাখা: {branchName}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={customers.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition cursor-pointer disabled:opacity-50"
          >
            <Download size={14} /> এক্সেল ডাউনলোড (CSV)
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer shadow-xs"
          >
            <Printer size={14} /> প্রিন্ট রিপোর্ট
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ReportKpiCard
          title="মোট কাস্টমার বাকি (Total Due)"
          value={`${currencySymbol}${kpis.totalDueAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          subtitle="মার্কেটে অনাদায়ী মোট দেনা"
          icon={CreditCard}
          variant="danger"
        />
        <ReportKpiCard
          title="বাকি থাকা কাস্টমার (Debtors)"
          value={`${kpis.totalDueCustomers} জন`}
          subtitle={`গড় বাকি: ${currencySymbol}${kpis.averageDuePerCustomer.toFixed(0)}`}
          icon={Users}
          variant="info"
        />
        <ReportKpiCard
          title="৩০+ দিনের মেয়াদোত্তীর্ণ বাকি"
          value={`${currencySymbol}${kpis.overdue30DaysAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          subtitle="উচ্চ ঝুঁকিপূর্ণ মেয়াদোত্তীর্ণ ঋণ"
          icon={AlertTriangle}
          variant="warning"
        />
        <ReportKpiCard
          title="লিমিট পার হওয়া খাতা"
          value={`${kpis.creditExceededCustomersCount} জন`}
          subtitle="অনুমোদিত ক্রেডিট লিমিট ছাড়িয়েছে"
          icon={ShieldAlert}
          variant="danger"
        />
      </div>

      {/* Advanced Filter Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white dark:bg-neutral-900 p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
        <input
          type="text"
          placeholder="নাম, ফোন বা গ্রাম দিয়ে খুঁজুন..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="text-xs px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-neutral-900 dark:text-neutral-100"
        />

        <select
          value={searchParams.get("type") || "all"}
          onChange={(e) => handleFilter("type", e.target.value)}
          className="text-xs px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 outline-none cursor-pointer font-medium text-neutral-900 dark:text-neutral-100"
        >
          <option value="all">সকল কাস্টমার ধরন (All Types)</option>
          <option value="PERMANENT">স্থায়ী কাস্টমার (Permanent Khata)</option>
          <option value="WALK_IN">চলতি খুচরা কাস্টমার (Walk-in)</option>
        </select>

        <select
          value={searchParams.get("aging") || "all"}
          onChange={(e) => handleFilter("aging", e.target.value)}
          className="text-xs px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 outline-none font-semibold cursor-pointer text-neutral-800 dark:text-neutral-200"
        >
          <option value="all">সকল বকেয়া রেকর্ড (All Records)</option>
          <option value="overdue30">⚠️ ৩০+ দিনের মেয়াদোত্তীর্ণ বাকি (Overdue)</option>
          <option value="overlimit">🛑 লিমিট শেষ হয়ে যাওয়া খাতা (Overlimit)</option>
        </select>
      </div>

      {/* Data Table */}
      <DataTable table={table} columns={columns} />

      {/* Khata Ledger Statement Modal */}
      {activeCustomer && (
        <CustomerKhataModal
          customer={activeCustomer}
          currencySymbol={currencySymbol}
          shopName={shopName}
          branchName={branchName}
          onClose={() => setActiveCustomer(null)}
        />
      )}
    </div>
  );
}