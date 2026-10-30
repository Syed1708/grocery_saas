"use client";
"use no memo";

import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Edit2, Trash2, Shield } from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";
import { IPartner } from "@/types/partner";

const RELATIONSHIP_LABELS: Record<string, string> = {
  FATHER: "বাবা (Father)",
  UNCLE: "চাচা (Uncle)",
  BROTHER: "ভাই (Brother)",
  SELF: "নিজে (Self)",
  OTHER: "অন্যান্য (Partner)",
};

export default function PartnersTab({
  partners,
  currencySymbol = "৳",
  onEdit,
  onDelete,
}: {
  partners: IPartner[];
  currencySymbol?: string;
  onEdit: (p: IPartner) => void;
  onDelete: (p: IPartner) => void;
}) {
  const columns: ColumnDef<IPartner>[] = [
    {
      accessorKey: "name",
      header: "Partner / Relation",
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div>
            <span className="font-bold text-neutral-900 dark:text-neutral-100 block">{p.name}</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full mt-0.5">
              <Shield size={10} /> {RELATIONSHIP_LABELS[p.relationship] || p.relationship}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "equityPercent",
      header: "Equity %",
      cell: ({ row }) => (
        <span className="font-mono font-bold text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-lg">
          {Number(row.getValue("equityPercent"))}%
        </span>
      ),
    },
    {
      accessorKey: "openingCapital",
      header: "Opening Capital",
      cell: ({ row }) => (
        <span className="font-mono font-bold text-neutral-700 dark:text-neutral-300">
          {currencySymbol}{Number(row.getValue("openingCapital")).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "totalDrawings",
      header: "Cash Drawn",
      cell: ({ row }) => (
        <span className="font-mono font-bold text-rose-600">
          -{currencySymbol}{Number(row.original.totalDrawings || 0).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "totalRations",
      header: "Home Rations (Cost)",
      cell: ({ row }) => (
        <span className="font-mono font-bold text-amber-600">
          -{currencySymbol}{Number(row.original.totalRations || 0).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "currentBalance",
      header: "Net Equity Balance",
      cell: ({ row }) => (
        <span className="font-mono font-black text-emerald-600 text-sm">
          {currencySymbol}{Number(row.getValue("currentBalance")).toLocaleString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onEdit(p)}
              className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
              title="Edit Partner"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => onDelete(p)}
              className="p-1.5 text-neutral-400 hover:text-rose-600 transition cursor-pointer"
              title="Delete Partner"
            >
              <Trash2 size={14} />
            </button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({ data: partners, columns, getCoreRowModel: getCoreRowModel() });
  return <DataTable table={table} columns={columns} />;
}