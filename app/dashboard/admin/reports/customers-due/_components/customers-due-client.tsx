"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Users, AlertTriangle, ShieldAlert, CreditCard } from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";
import { Input } from "@/components/common/ui/Input";
import { getCustomerDueColumns } from "./columns";
import CustomerKhataModal from "./customer-khata-modal";
import { ICustomerDueKPIs, ICustomerDueRow } from "@/types/index";
import { ReportKpiCard } from "../../common/report-kpi-card";

interface Props {
  kpis: ICustomerDueKPIs;
  customers: ICustomerDueRow[];
  currencySymbol: string;
  shopName: string;
}

export default function CustomersDueClient({ kpis, customers, currencySymbol, shopName }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeCustomer, setActiveCustomer] = useState<ICustomerDueRow | null>(null);

  const handleFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  };

  const columns = getCustomerDueColumns(currencySymbol, (c) => setActiveCustomer(c));
  const table = useReactTable({ data: customers, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ReportKpiCard
          title="মোট কাস্টমার বাকি (Total Due)"
          value={`${currencySymbol}${kpis.totalDueAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          subtitle="All uncollected customer debt"
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
          subtitle="High risk overdue debt"
          icon={AlertTriangle}
          variant="warning"
        />
        <ReportKpiCard
          title="লিমিট পার হওয়া খাতা"
          value={`${kpis.creditExceededCustomersCount} জন`}
          subtitle="Credit limit breached"
          icon={ShieldAlert}
          variant="danger"
        />
      </div>

      {/* Advanced Filter Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <Input
          placeholder="নাম, ফোন বা গ্রাম দিয়ে খুঁজুন..."
          defaultValue={searchParams.get("search") || ""}
          onChange={(e) => handleFilter("search", e.target.value)}
        />
        <select
          value={searchParams.get("type") || "all"}
          onChange={(e) => handleFilter("type", e.target.value)}
          className="text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 outline-none"
        >
          <option value="all">সকল কাস্টমার ধরন (All Types)</option>
          <option value="PERMANENT">স্থায়ী কাস্টমার (Permanent)</option>
          <option value="WALK_IN">চলতি কাস্টমার (Walk-in)</option>
        </select>
        <select
          value={searchParams.get("aging") || "all"}
          onChange={(e) => handleFilter("aging", e.target.value)}
          className="text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 outline-none font-semibold text-neutral-700 dark:text-neutral-300"
        >
          <option value="all">সকল বকেয়া রেকর্ড (All Records)</option>
          <option value="overdue30">⚠️ ৩০+ দিনের মেয়াদোত্তীর্ণ বাকি</option>
          <option value="overlimit">🛑 লিমিট শেষ হয়ে যাওয়া কাস্টমার</option>
        </select>
      </div>

      {/* Table */}
      <DataTable table={table} columns={columns} />

      {/* Modal */}
      {activeCustomer && (
        <CustomerKhataModal
          customer={activeCustomer}
          currencySymbol={currencySymbol}
          shopName={shopName}
          onClose={() => setActiveCustomer(null)}
        />
      )}
    </div>
  );
}