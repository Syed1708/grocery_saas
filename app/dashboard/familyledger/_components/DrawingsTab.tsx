"use client";
"use no memo";

import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Printer } from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";
import { TableActions } from "@/components/common/ui/table/TableHelpers";
import { IPartnerTransaction, PERMISSIONS } from "@/types";
import { format } from "date-fns";
import DrawingVoucherPdf from "./DrawingVoucherPdf";

const TYPE_BADGES: Record<string, { label: string; bg: string }> = {
  CASH_DRAWING: { label: "ক্যাশ উত্তোলন", bg: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400" },
  BANK_DRAWING: { label: "ব্যাংক উত্তোলন", bg: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400" },
  HOUSEHOLD_EXPENSE: { label: "পারিবারিক বিল", bg: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400" },
  CAPITAL_INJECTION: { label: "মূলধন জমা", bg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" },
};

export default function DrawingsTab({
  transactions,
  currencySymbol = "৳",
  shop,
  branchName,
  pagination,
  onEdit,
  onDelete,
}: {
  transactions: IPartnerTransaction[];
  currencySymbol?: string;
  shop: { name: string; phone?: string | null; address?: string | null };
  branchName: string;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number, pageSize: number) => void;
  };
  onEdit: (t: IPartnerTransaction) => void;
  onDelete: (t: IPartnerTransaction) => void;
}) {
  const [printTransaction, setPrintTransaction] = useState<IPartnerTransaction | null>(null);

  useEffect(() => {
    const clearAfterPrint = () => setPrintTransaction(null);
    window.addEventListener("afterprint", clearAfterPrint);
    return () => window.removeEventListener("afterprint", clearAfterPrint);
  }, []);

  const printDrawingPdf = (transaction: IPartnerTransaction) => {
    flushSync(() => setPrintTransaction(transaction));
    window.print();
  };

  const columns: ColumnDef<IPartnerTransaction>[] = [
    {
      accessorKey: "voucherNo",
      header: "Voucher #",
      cell: ({ row }) => <span className="font-mono font-bold">#{row.getValue("voucherNo")}</span>,
    },
    {
      accessorKey: "transactionDate",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-neutral-500 text-xs">
          {format(new Date(row.original.transactionDate), "dd MMM, yyyy")}
        </span>
      ),
    },
    {
      accessorKey: "partnerName",
      header: "Partner",
      cell: ({ row }) => <span className="font-bold text-neutral-900 dark:text-white">{row.original.partnerName}</span>,
    },
    {
      accessorKey: "type",
      header: "Type & Purpose",
      cell: ({ row }) => {
        const badge = TYPE_BADGES[row.original.type] || { label: row.original.type, bg: "bg-neutral-100" };
        return (
          <div>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${badge.bg}`}>
              {badge.label}
            </span>
            <span className="text-xs text-neutral-600 dark:text-neutral-300 block mt-0.5">{row.original.purpose}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "accountName",
      header: "Source Account",
      cell: ({ row }) => <span className="text-xs text-neutral-500">{row.original.accountName}</span>,
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const isCap = row.original.type === "CAPITAL_INJECTION";
        return (
          <span className={`font-mono font-black text-sm ${isCap ? "text-emerald-600" : "text-rose-600"}`}>
            {isCap ? "+" : "-"}{currencySymbol}{Number(row.getValue("amount")).toLocaleString()}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => printDrawingPdf(row.original)}
            className="inline-flex items-center gap-1 px-1.5 py-1 rounded-lg text-[10px] font-bold text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition cursor-pointer"
            title="Print drawing or bill voucher PDF"
          >
            <Printer size={13} /> PDF
          </button>
          <TableActions
            onEdit={() => onEdit(row.original)}
            editPermission={PERMISSIONS.FAMILY_LEDGER_ACCESS}
            onDelete={() => onDelete(row.original)}
            deletePermission={PERMISSIONS.FAMILY_LEDGER_ACCESS}
          />
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: transactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.max(1, Math.ceil(pagination.total / pagination.pageSize)),
    state: {
      pagination: {
        pageIndex: pagination.page - 1,
        pageSize: pagination.pageSize,
      },
    },
    onPaginationChange: (updater) => {
      const current = {
        pageIndex: pagination.page - 1,
        pageSize: pagination.pageSize,
      };
      const next = typeof updater === "function" ? updater(current) : updater;
      pagination.onPageChange(next.pageIndex + 1, next.pageSize);
    },
  });
  return (
    <>
      <DataTable table={table} columns={columns} totalCount={pagination.total} />
      {printTransaction && (
        <DrawingVoucherPdf
          transaction={printTransaction}
          currencySymbol={currencySymbol}
          shop={shop}
          branchName={branchName}
        />
      )}
    </>
  );
}