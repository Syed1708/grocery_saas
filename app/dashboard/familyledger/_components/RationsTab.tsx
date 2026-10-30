"use client";
"use no memo";

import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { DataTable } from "@/components/common/data-table/DataTable";
import { IPartnerRation } from "@/types/partner";
import { format } from "date-fns";

export default function RationsTab({
  rations,
  currencySymbol = "৳",
}: {
  rations: IPartnerRation[];
  currencySymbol?: string;
}) {
  const columns: ColumnDef<IPartnerRation>[] = [
    {
      accessorKey: "rationNo",
      header: "Ration #",
      cell: ({ row }) => <span className="font-mono font-bold text-amber-600">#{row.getValue("rationNo")}</span>,
    },
    {
      accessorKey: "rationDate",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-neutral-500 text-xs">{format(new Date(row.original.rationDate), "dd MMM, yyyy")}</span>
      ),
    },
    {
      accessorKey: "partnerName",
      header: "Partner Taken For",
      cell: ({ row }) => <span className="font-bold text-neutral-900 dark:text-white">{row.original.partnerName}</span>,
    },
    {
      id: "items",
      header: "Issued Products (At Purchase Cost)",
      cell: ({ row }) => (
        <div className="space-y-1">
          {row.original.items.map((it) => (
            <span key={it.id} className="inline-block bg-neutral-100 dark:bg-neutral-800 text-[11px] px-2 py-0.5 rounded mr-1.5 mb-1">
              {it.productName} × {it.quantity} {it.unitName || ""} (৳{it.lineTotal.toLocaleString()})
            </span>
          ))}
        </div>
      ),
    },
    {
      accessorKey: "totalCost",
      header: "Total Cost",
      cell: ({ row }) => (
        <span className="font-mono font-black text-amber-600 text-sm">
          {currencySymbol}{Number(row.getValue("totalCost")).toLocaleString()}
        </span>
      ),
    },
  ];

  const table = useReactTable({ data: rations, columns, getCoreRowModel: getCoreRowModel() });
  return <DataTable table={table} columns={columns} />;
}