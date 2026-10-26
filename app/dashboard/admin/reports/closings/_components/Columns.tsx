"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ICashRegisterClosing } from "@/types/closing";
import { Printer } from "lucide-react";

export const getClosingColumns = (
  currency: string,
  onPrint: (closing: ICashRegisterClosing) => void
): ColumnDef<ICashRegisterClosing>[] => [
  {
    accessorKey: "closingDate",
    header: "ক্লোজিং তারিখ ও সময়",
    cell: ({ row }) => (
      <div>
        <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 block">
          {new Date(row.original.closingDate).toLocaleDateString()}
        </span>
        <span className="text-[10px] font-mono text-neutral-400">
          {row.original.closingTime || "Shift Close"}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "totalInvoices",
    header: "স্লিপ সংখ্যা",
    cell: ({ row }) => (
      <span className="font-mono text-xs font-semibold">
        {row.getValue("totalInvoices")} টি
      </span>
    ),
  },
  {
    accessorKey: "expectedCash",
    header: "প্রত্যাশিত ক্যাশ",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400">
        {currency}{Number(row.getValue("expectedCash")).toFixed(2)}
      </span>
    ),
  },
  {
    accessorKey: "countedCash",
    header: "বাস্তব গণনা",
    cell: ({ row }) => (
      <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
        {currency}{Number(row.getValue("countedCash")).toFixed(2)}
      </span>
    ),
  },
  {
    accessorKey: "difference",
    header: "গরমিল (Discrepancy)",
    cell: ({ row }) => {
      const diff = Number(row.getValue("difference"));
      const isShort = diff < 0;
      const isExact = diff === 0;

      return (
        <span
          className={`font-mono font-bold text-xs ${
            isShort ? "text-red-600" : isExact ? "text-neutral-500" : "text-emerald-600"
          }`}
        >
          {isExact ? "সঠিক (Exact)" : `${diff > 0 ? "+" : ""}${currency}${diff.toFixed(2)}`}
        </span>
      );
    },
  },
  {
    id: "cashier",
    header: "ক্যাশিয়ার",
    cell: ({ row }) => (
      <span className="text-xs text-neutral-600 dark:text-neutral-300 font-medium">
        {row.original.user?.name || "Cashier"}
      </span>
    ),
  },
  {
    id: "actions",
    header: "রসিদ প্রিন্ট",
    cell: ({ row }) => (
      <button
        type="button"
        onClick={() => onPrint(row.original)}
        className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-300 transition cursor-pointer"
        title="Print 80mm Z-Slip"
      >
        <Printer size={15} />
      </button>
    ),
  },
];