"use client";

import { useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Download, Printer, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { StatCard } from "@/components/common/StatCard";
import { Input } from "@/components/common/ui/Input";
import { DataTable } from "@/components/common/data-table/DataTable";
import {
  IFamilyReportData,
  IFamilyReportPartnerRow,
  IPartnerRation,
  IPartnerTransaction,
} from "@/types/partner";
import FamilyReportPdf, { FamilyPdfSection } from "./FamilyReportPdf";

const RELATIONSHIP_LABELS: Record<string, string> = {
  FATHER: "বাবা (Father)",
  UNCLE: "চাচা (Uncle)",
  BROTHER: "ভাই (Brother)",
  SELF: "নিজে (Self)",
  OTHER: "অন্যান্য (Partner)",
};

const TRANSACTION_LABELS: Record<string, string> = {
  CASH_DRAWING: "ক্যাশ উত্তোলন",
  BANK_DRAWING: "ব্যাংক উত্তোলন",
  HOUSEHOLD_EXPENSE: "পারিবারিক বিল",
  CAPITAL_INJECTION: "মূলধন জমা",
  PROFIT_DISTRIBUTION: "মুনাফা বিতরণ",
};

function csvCell(value: string | number): string {
  if (typeof value === "number") return String(value);
  const guarded = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\n]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

interface Props {
  data: IFamilyReportData;
  partnerOptions: { id: string; name: string }[];
  currencySymbol?: string;
  shop: { name: string; phone?: string | null; address?: string | null };
  branchName: string;
}

export default function FamilyReportClient({
  data,
  partnerOptions,
  currencySymbol = "৳",
  shop,
  branchName,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pdfSection, setPdfSection] = useState<FamilyPdfSection>("all");

  const printPdf = (section: FamilyPdfSection) => {
    flushSync(() => setPdfSection(section));
    window.print();
  };

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  };

  const hasFilters = Boolean(
    searchParams.get("startDate") || searchParams.get("endDate") || searchParams.get("partnerId")
  );

  const periodLabel = useMemo(() => {
    const start = searchParams.get("startDate");
    const end = searchParams.get("endDate");
    if (!start && !end) return "All time";
    return `${start || "beginning"} → ${end || "today"}`;
  }, [searchParams]);

  const partnerColumns: ColumnDef<IFamilyReportPartnerRow>[] = [
    {
      accessorKey: "name",
      header: "Partner",
      cell: ({ row }) => (
        <div>
          <span className="font-bold text-xs">{row.original.name}</span>
          <span className="block text-[10px] text-neutral-400">
            {RELATIONSHIP_LABELS[row.original.relationship] || row.original.relationship}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "equityPercent",
      header: "Equity %",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold">{row.original.equityPercent}%</span>
      ),
    },
    {
      accessorKey: "openingCapital",
      header: "Opening",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{currencySymbol}{row.original.openingCapital.toFixed(2)}</span>
      ),
    },
    {
      accessorKey: "injections",
      header: "Injected",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-emerald-600">+{currencySymbol}{row.original.injections.toFixed(2)}</span>
      ),
    },
    {
      accessorKey: "drawings",
      header: "Drawings",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-rose-600">-{currencySymbol}{row.original.drawings.toFixed(2)}</span>
      ),
    },
    {
      accessorKey: "rations",
      header: "Groceries",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-amber-600">-{currencySymbol}{row.original.rations.toFixed(2)}</span>
      ),
    },
    {
      accessorKey: "netEquity",
      header: "Net Equity",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-black text-blue-600">{currencySymbol}{row.original.netEquity.toFixed(2)}</span>
      ),
    },
  ];

  const transactionColumns: ColumnDef<IPartnerTransaction>[] = [
    {
      accessorKey: "voucherNo",
      header: "Voucher",
      cell: ({ row }) => <span className="font-mono text-xs font-bold">#{row.original.voucherNo}</span>,
    },
    {
      accessorKey: "transactionDate",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-xs text-neutral-500">{format(new Date(row.original.transactionDate), "dd MMM yyyy")}</span>
      ),
    },
    {
      accessorKey: "partnerName",
      header: "Partner",
      cell: ({ row }) => <span className="text-xs font-semibold">{row.original.partnerName}</span>,
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <span className="text-xs">{TRANSACTION_LABELS[row.original.type] || row.original.type}</span>
      ),
    },
    {
      accessorKey: "purpose",
      header: "Purpose",
      cell: ({ row }) => <span className="text-xs text-neutral-500">{row.original.purpose || "—"}</span>,
    },
    {
      accessorKey: "accountName",
      header: "Account",
      cell: ({ row }) => <span className="text-xs">{row.original.accountName || "—"}</span>,
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const isInjection = row.original.type === "CAPITAL_INJECTION";
        return (
          <span className={`font-mono text-xs font-bold ${isInjection ? "text-emerald-600" : "text-rose-600"}`}>
            {isInjection ? "+" : "-"}{currencySymbol}{row.original.amount.toFixed(2)}
          </span>
        );
      },
    },
  ];

  const rationColumns: ColumnDef<IPartnerRation>[] = [
    {
      accessorKey: "rationNo",
      header: "Ration #",
      cell: ({ row }) => <span className="font-mono text-xs font-bold text-amber-600">#{row.original.rationNo}</span>,
    },
    {
      accessorKey: "rationDate",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-xs text-neutral-500">{format(new Date(row.original.rationDate), "dd MMM yyyy")}</span>
      ),
    },
    {
      accessorKey: "partnerName",
      header: "Partner",
      cell: ({ row }) => <span className="text-xs font-semibold">{row.original.partnerName}</span>,
    },
    {
      id: "items",
      header: "Items",
      cell: ({ row }) => (
        <span className="text-xs text-neutral-500">
          {row.original.items.map((it) => `${it.productName} × ${it.quantity}`).join(", ")}
        </span>
      ),
    },
    {
      accessorKey: "totalCost",
      header: "Total Cost",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-amber-600">{currencySymbol}{row.original.totalCost.toFixed(2)}</span>
      ),
    },
  ];

  const partnerTable = useReactTable({
    data: data.partners,
    columns: partnerColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
  const transactionTable = useReactTable({
    data: data.transactions,
    columns: transactionColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
  const rationTable = useReactTable({
    data: data.rations,
    columns: rationColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      {/* Screen toolbar */}
      <div className="print:hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 rounded-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold">Family Ledger Report</h2>
            <p className="text-[11px] text-neutral-500">
              {shop.name} • {branchName} • {periodLabel}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => printPdf("all")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 dark:bg-neutral-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              <Printer size={13} /> PDF (A4)
            </button>
            {hasFilters && (
              <button
                type="button"
                onClick={() => router.push(pathname)}
                className="flex items-center gap-1 text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
              >
                <RotateCcw size={12} /> Reset
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          <Input
            type="date"
            value={searchParams.get("startDate") || ""}
            onChange={(e) => setFilter("startDate", e.target.value)}
            aria-label="Start date"
          />
          <Input
            type="date"
            value={searchParams.get("endDate") || ""}
            onChange={(e) => setFilter("endDate", e.target.value)}
            aria-label="End date"
          />
          <select
            value={searchParams.get("partnerId") || "all"}
            onChange={(e) => setFilter("partnerId", e.target.value)}
            aria-label="Filter by partner"
            className="text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 outline-none cursor-pointer"
          >
            <option value="all">All Partners</option>
            {partnerOptions.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Print-only title is rendered by FamilyReportPdf */}
      <div className="hidden print:block mb-3">
        <h1 className="text-lg font-bold">{shop.name} — Family Ledger Report</h1>
        <p className="text-xs">
          {branchName} • {periodLabel}
          {shop.phone ? ` • ${shop.phone}` : ""}
          {shop.address ? ` • ${shop.address}` : ""}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard title="Opening Capital" value={`${currencySymbol}${data.kpis.openingCapital.toFixed(2)}`} tone="neutral" />
        <StatCard title="Capital Injected" value={`${currencySymbol}${data.kpis.injections.toFixed(2)}`} tone="emerald" />
        <StatCard title="Drawings & Bills" value={`${currencySymbol}${data.kpis.drawings.toFixed(2)}`} tone="rose" />
        <StatCard title="Home Groceries" value={`${currencySymbol}${data.kpis.rations.toFixed(2)}`} tone="amber" />
        <StatCard title="Net Family Equity" value={`${currencySymbol}${data.kpis.netEquity.toFixed(2)}`} tone="blue" />
      </div>

      {/* Partner equity */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Partner Equity Summary
          </h3>
          <div className="print:hidden flex items-center gap-3">
            <button
              type="button"
              onClick={() => printPdf("partners")}
              className="flex items-center gap-1 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 hover:underline cursor-pointer"
            >
              <Printer size={12} /> PDF
            </button>
            <button
              type="button"
              onClick={() =>
              downloadCsv(
                `family-partners-${Date.now()}.csv`,
                ["Partner", "Relationship", "Equity %", "Opening", "Injections", "Drawings", "Rations", "Net Equity"],
                data.partners.map((p) => [
                  p.name,
                  p.relationship,
                  p.equityPercent,
                  p.openingCapital,
                  p.injections,
                  p.drawings,
                  p.rations,
                  p.netEquity,
                ])
              )
            }
            className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
          >
            <Download size={12} /> CSV
            </button>
          </div>
        </div>
        <DataTable table={partnerTable} columns={partnerColumns} />
      </section>

      {/* Transactions */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Drawings, Bills & Capital ({data.transactions.length})
          </h3>
          <div className="print:hidden flex items-center gap-3">
            <button
              type="button"
              onClick={() => printPdf("transactions")}
              className="flex items-center gap-1 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 hover:underline cursor-pointer"
            >
              <Printer size={12} /> PDF
            </button>
            <button
              type="button"
              onClick={() =>
                downloadCsv(
                  `family-transactions-${Date.now()}.csv`,
                  ["Voucher", "Date", "Partner", "Type", "Purpose", "Account", "Amount"],
                  data.transactions.map((t) => [
                    t.voucherNo,
                    format(new Date(t.transactionDate), "yyyy-MM-dd"),
                    t.partnerName || "",
                    t.type,
                    t.purpose || "",
                    t.accountName || "",
                    t.amount,
                  ])
                )
              }
              className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
            >
              <Download size={12} /> CSV
            </button>
          </div>
        </div>
        <DataTable table={transactionTable} columns={transactionColumns} />
      </section>

      {/* Rations */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Home Groceries ({data.rations.length})
          </h3>
          <div className="print:hidden flex items-center gap-3">
            <button
              type="button"
              onClick={() => printPdf("rations")}
              className="flex items-center gap-1 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 hover:underline cursor-pointer"
            >
              <Printer size={12} /> PDF
            </button>
            <button
              type="button"
              onClick={() =>
                downloadCsv(
                  `family-rations-${Date.now()}.csv`,
                  ["Ration #", "Date", "Partner", "Items", "Total Cost"],
                  data.rations.map((r) => [
                    r.rationNo,
                    format(new Date(r.rationDate), "yyyy-MM-dd"),
                    r.partnerName || "",
                    r.items.map((it) => `${it.productName} x${it.quantity}`).join(" | "),
                    r.totalCost,
                  ])
                )
              }
              className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
            >
              <Download size={12} /> CSV
            </button>
          </div>
        </div>
        <DataTable table={rationTable} columns={rationColumns} />
      </section>

      <FamilyReportPdf
        data={data}
        currencySymbol={currencySymbol}
        shop={shop}
        branchName={branchName}
        periodLabel={periodLabel}
        section={pdfSection}
      />
    </div>
  );
}
