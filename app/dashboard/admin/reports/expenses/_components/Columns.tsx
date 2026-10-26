"use client";

import { ColumnDef } from "@tanstack/react-table";
import { IExpenseReportRow } from "@/types/expenses";
import ExpenseRowActions from "./ExpenseRowActions";

export const getExpenseColumns = (currency: string): ColumnDef<IExpenseReportRow>[] => [
  {
    accessorKey: "voucherNo",
    header: "ভাউচার নং",
    cell: ({ row }) => (
      <div>
        <span className="font-mono font-bold text-xs text-neutral-900 dark:text-neutral-100 block">
          #{row.getValue("voucherNo")}
        </span>
        <span className="text-[10px] text-neutral-400 font-mono">
          {new Date(row.original.expenseDate).toLocaleDateString()}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "categoryName",
    header: "খরচের খাত (Category)",
    cell: ({ row }) => (
      <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
        {row.original.categoryName}
      </span>
    ),
  },
  {
    accessorKey: "amount",
    header: "টাকার পরিমাণ",
    cell: ({ row }) => (
      <span className="font-mono font-bold text-xs text-red-600 dark:text-red-400">
        {currency}{row.original.amount.toFixed(2)}
      </span>
    ),
  },
  {
    accessorKey: "paymentMethod",
    header: "পরিশোধের মাধ্যম",
    cell: ({ row }) => {
      const method = row.original.paymentMethod.toLowerCase();
      let badge = "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300";
      if (method === "cash") badge = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400";
      if (method === "bank") badge = "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400";
      if (method === "bkash" || method === "nagad") badge = "bg-pink-50 text-pink-700 dark:bg-pink-950/50 dark:text-pink-400";

      return (
        <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded uppercase tracking-wider ${badge}`}>
          {row.original.paymentMethod}
        </span>
      );
    },
  },
  {
    accessorKey: "reference",
    header: "রেফারেন্স / নোট",
    cell: ({ row }) => (
      <div className="max-w-xs truncate text-xs">
        <span className="font-medium text-neutral-700 dark:text-neutral-300 block">
          {row.original.reference || "-"}
        </span>
        {row.original.note && (
          <span className="text-[10px] text-neutral-400 truncate block">
            {row.original.note}
          </span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "spentBy",
    header: "অনুমোদনকারী",
    cell: ({ row }) => (
      <span className="text-xs text-neutral-500 font-medium">
        {row.original.spentBy || "Staff"}
      </span>
    ),
  },
  {
    id: "actions",
    header: "অ্যাকশন",
    cell: ({ row }) => <ExpenseRowActions row={row.original} />,
  },
];