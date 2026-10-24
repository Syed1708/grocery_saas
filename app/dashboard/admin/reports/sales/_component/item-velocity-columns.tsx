import { ColumnDef } from "@tanstack/react-table";
import { IItemVelocityRow } from "@/types/index";

export const getItemVelocityColumns = (currency: string): ColumnDef<IItemVelocityRow>[] => [
  {
    accessorKey: "productName",
    header: "Product / Item",
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-xs">{row.original.productName}</p>
        <span className="text-[10px] font-mono text-neutral-400">{row.original.barcode}</span>
      </div>
    ),
  },
  {
    accessorKey: "totalQuantity",
    header: "Qty Sold",
    cell: ({ row }) => <span className="font-mono font-bold text-xs">{row.getValue("totalQuantity")}</span>,
  },
  {
    accessorKey: "totalRevenue",
    header: "Total Revenue",
    cell: ({ row }) => <span className="font-mono font-semibold text-xs">{currency}{Number(row.getValue("totalRevenue")).toFixed(2)}</span>,
  },
  {
    accessorKey: "totalProfit",
    header: "Gross Profit",
    cell: ({ row }) => {
      const profit = Number(row.getValue("totalProfit"));
      return (
        <span className={`font-mono font-bold text-xs ${profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
          {currency}{profit.toFixed(2)}
        </span>
      );
    },
  },
  {
    accessorKey: "marginPercent",
    header: "Margin",
    cell: ({ row }) => (
      <span className="text-xs font-mono font-semibold bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
        {row.getValue("marginPercent")}%
      </span>
    ),
  },
];