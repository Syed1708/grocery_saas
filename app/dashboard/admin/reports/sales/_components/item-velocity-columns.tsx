import { ColumnDef } from "@tanstack/react-table";
import { IItemVelocityRow } from "@/types/index";

export const getItemVelocityColumns = (
  currency: string,
  canViewMargins: boolean = true // 👈 FIX: Accept 2nd argument to role-gate profit margins!
): ColumnDef<IItemVelocityRow>[] => {
  const columns: ColumnDef<IItemVelocityRow>[] = [
    {
      accessorKey: "productName",
      header: "পণ্য (Product / Item)",
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
            {row.original.productName}
          </p>
          <span className="text-[10px] font-mono text-neutral-400">{row.original.barcode}</span>
        </div>
      ),
    },
    {
      accessorKey: "totalQuantity",
      header: "বিক্রিত পরিমাণ (Qty Sold)",
      cell: ({ row }) => (
        <span className="font-mono font-bold text-xs">{row.getValue("totalQuantity")}</span>
      ),
    },
    {
      accessorKey: "totalRevenue",
      header: "মোট বিক্রয় (Revenue)",
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-xs">
          {currency}{Number(row.getValue("totalRevenue")).toFixed(2)}
        </span>
      ),
    },
  ];

  // 🛡️ Privacy: Only show profit columns to Owners and Managers
  if (canViewMargins) {
    columns.push(
      {
        accessorKey: "totalProfit",
        header: "মোট লাভ (Gross Profit)",
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
        header: "মার্জিন %",
        cell: ({ row }) => (
          <span className="text-xs font-mono font-bold bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
            {row.getValue("marginPercent")}%
          </span>
        ),
      }
    );
  }

  return columns;
};