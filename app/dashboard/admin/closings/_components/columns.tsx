import { ColumnDef } from "@tanstack/react-table";
import { ICashRegisterClosing } from "@/types/closing";
import { Printer } from "lucide-react";

export const getClosingColumns = (
  currency: string,
  onPrint: (closing: ICashRegisterClosing) => void
): ColumnDef<ICashRegisterClosing>[] => [
  {
    accessorKey: "closingDate",
    header: "Date",
    cell: ({ row }) => (
      <span className="font-semibold text-xs">
        {new Date(row.original.closingDate).toLocaleDateString()}
      </span>
    ),
  },
  {
    accessorKey: "totalInvoices",
    header: "Slips",
    cell: ({ row }) => <span className="font-mono text-xs">{row.getValue("totalInvoices")}</span>,
  },
  {
    accessorKey: "expectedCash",
    header: "Expected",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {currency}
        {Number(row.getValue("expectedCash")).toFixed(2)}
      </span>
    ),
  },
  {
    accessorKey: "countedCash",
    header: "Counted",
    cell: ({ row }) => (
      <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
        {currency}
        {Number(row.getValue("countedCash")).toFixed(2)}
      </span>
    ),
  },
  {
    accessorKey: "difference",
    header: "Discrepancy",
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
          {isExact ? "Exact Match" : `${diff > 0 ? "+" : ""}${currency}${diff.toFixed(2)}`}
        </span>
      );
    },
  },
  {
    id: "cashier",
    header: "Closed By",
    cell: ({ row }) => (
      <span className="text-xs text-neutral-500 font-medium">
        {row.original.user?.name || "Cashier"}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Receipt",
    cell: ({ row }) => (
      <button
        onClick={() => onPrint(row.original)}
        className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-300 transition cursor-pointer"
        title="Print Thermal Z-Slip"
      >
        <Printer size={15} />
      </button>
    ),
  },
];