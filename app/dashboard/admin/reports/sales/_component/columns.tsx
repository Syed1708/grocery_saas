import { ColumnDef } from "@tanstack/react-table";
import { ISaleReportRow } from "@/types/index";

export const getSalesReportColumns = (currency: string): ColumnDef<ISaleReportRow>[] => [
  {
    accessorKey: "invoiceNo",
    header: "Invoice",
    cell: ({ row }) => <span className="font-mono font-semibold text-xs text-blue-600">{row.getValue("invoiceNo")}</span>,
  },
  {
    accessorKey: "saleDate",
    header: "Date",
    cell: ({ row }) => <span className="text-xs">{new Date(row.original.saleDate).toLocaleDateString()}</span>,
  },
  {
    accessorKey: "customerName",
    header: "Customer",
    cell: ({ row }) => (
      <div className="text-xs">
        <p className="font-medium">{row.original.customerName}</p>
        {row.original.customerPhone && <p className="text-[10px] text-neutral-400">{row.original.customerPhone}</p>}
      </div>
    ),
  },
  {
    accessorKey: "paymentMethod",
    header: "Method",
    cell: ({ row }) => (
      <span className="text-[11px] uppercase font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">
        {row.getValue("paymentMethod")}
      </span>
    ),
  },
  {
    accessorKey: "grandTotal",
    header: "Total",
    cell: ({ row }) => <span className="font-mono text-xs font-bold">{currency}{Number(row.getValue("grandTotal")).toFixed(2)}</span>,
  },
  {
    accessorKey: "paidAmount",
    header: "Paid",
    cell: ({ row }) => <span className="font-mono text-xs text-emerald-600">{currency}{Number(row.getValue("paidAmount")).toFixed(2)}</span>,
  },
  {
    accessorKey: "dueAmount",
    header: "Due",
    cell: ({ row }) => {
      const due = Number(row.getValue("dueAmount"));
      return (
        <span className={`font-mono text-xs font-semibold ${due > 0 ? "text-red-600" : "text-neutral-400"}`}>
          {currency}{due.toFixed(2)}
        </span>
      );
    },
  },
  {
    accessorKey: "cashierName",
    header: "Cashier",
    cell: ({ row }) => <span className="text-xs text-neutral-500">{row.getValue("cashierName")}</span>,
  },
];