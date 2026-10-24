"use client";
"use no memo";

import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Edit2, Trash2 } from "lucide-react"; // 👈 Make sure Edit2 is imported
import { DataTable } from "@/components/common/data-table/DataTable";
import { IBankCheque } from "@/types";

export default function ChequesTab({
  cheques,
  currencySymbol,
  onClearCheque,
  onEditCheque,   // 👈 Destructured prop
  onDeleteCheque,
}: {
  cheques: IBankCheque[];
  currencySymbol: string;
  onClearCheque: (c: IBankCheque) => void;
  onEditCheque: (c: IBankCheque) => void; // 👈 Added to type
  onDeleteCheque: (c: IBankCheque) => void;
}) {
  const columns: ColumnDef<IBankCheque>[] = [
    {
      accessorKey: "chequeNumber",
      header: "Cheque #",
      cell: ({ row }) => <span className="font-mono font-bold">#{row.getValue("chequeNumber")}</span>,
    },
    {
      accessorKey: "partyName",
      header: "Party / Party Type",
      cell: ({ row }) => (
        <div>
          <span className="font-semibold">{row.getValue("partyName")}</span>
          <span className="text-[10px] text-neutral-400 block">{row.original.partyType} • {row.original.type}</span>
        </div>
      ),
    },
    { accessorKey: "bankName", header: "Bank", cell: ({ row }) => <span className="text-xs">{row.getValue("bankName")}</span> },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <span className="font-black font-mono">{currencySymbol}{Number(row.getValue("amount")).toFixed(2)}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const st = row.original.status;
        return (
          <span
            className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
              st === "CLEARED"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                : st === "PENDING"
                ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
            }`}
          >
            {st}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const chq = row.original;
        return (
          <div className="flex items-center gap-2">
            {chq.status === "PENDING" && (
              <button
                onClick={() => onClearCheque(chq)}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition cursor-pointer"
              >
                Clear Cheque
              </button>
            )}
            {chq.status === "PENDING" && (
              <button
                onClick={() => onEditCheque(chq)}
                className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
                title="Edit Cheque"
              >
                <Edit2 size={15} />
              </button>
            )}
            {chq.status === "PENDING" && (
              <button
                onClick={() => onDeleteCheque(chq)}
                className="p-1.5 text-neutral-400 hover:text-red-600 transition cursor-pointer"
                title="Delete Cheque"
              >
                <Trash2 size={15} />
              </button>
            )}
            {chq.status !== "PENDING" && (
              <span className="text-neutral-400 text-[11px]">Cleared via {chq.accountName}</span>
            )}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({ data: cheques, columns, getCoreRowModel: getCoreRowModel() });
  return <DataTable table={table} columns={columns} />;
}