"use client";
"use no memo";

import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { DataTable } from "@/components/common/data-table/DataTable";
import { ILoan } from "@/types";

export default function LoansTab({
  loans,
  currencySymbol,
  onPayInstallment,
}: {
  loans: ILoan[];
  currencySymbol: string;
  onPayInstallment: (l: ILoan) => void;
}) {
  const columns: ColumnDef<ILoan>[] = [
    {
      accessorKey: "personName",
      header: "Person / Party",
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">
            {row.getValue("personName")}
          </span>
          <span className="text-[10px] text-neutral-400 font-mono">
            {row.original.phone || "No Phone"} • {row.original.accountName}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.original.type;
        return (
          <span
            className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
              type === "TAKEN"
                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400"
                : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400"
            }`}
          >
            {type === "TAKEN" ? "Loan Taken (ঋণ গ্রহণ)" : "Loan Given (ধার প্রদান)"}
          </span>
        );
      },
    },
    {
      accessorKey: "amount",
      header: "Initial Amount",
      cell: ({ row }) => (
        <span className="font-mono">{currencySymbol}{Number(row.getValue("amount")).toFixed(2)}</span>
      ),
    },
    {
      accessorKey: "remainingAmount",
      header: "Remaining Balance",
      cell: ({ row }) => (
        <span className="font-black text-red-600 font-mono">
          {currencySymbol}{Number(row.getValue("remainingAmount")).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
            row.original.status === "PAID"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
              : "bg-neutral-100 text-neutral-600"
          }`}
        >
          {row.original.status}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const loan = row.original;
        if (loan.status === "ACTIVE") {
          return (
            <button
              onClick={() => onPayInstallment(loan)}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition cursor-pointer"
            >
              + Pay Installment
            </button>
          );
        }
        return <span className="text-emerald-600 font-bold text-xs">Fully Paid ✓</span>;
      },
    },
  ];

  const table = useReactTable({ data: loans, columns, getCoreRowModel: getCoreRowModel() });
  return <DataTable table={table} columns={columns} />;
}