"use client";
"use no memo";
import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Edit2, Trash2 } from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";
import { ICompanyAsset } from "@/types";

export default function AssetsTab({ assets, currencySymbol, onEdit, onDelete }: { assets: ICompanyAsset[]; currencySymbol: string; onEdit: (a: ICompanyAsset) => void; onDelete: (a: ICompanyAsset) => void }) {
  const columns: ColumnDef<ICompanyAsset>[] = [
    { accessorKey: "assetCode", header: "Code", cell: ({ row }) => <span className="font-mono">{row.getValue("assetCode")}</span> },
    { accessorKey: "name", header: "Asset Name", cell: ({ row }) => <span className="font-semibold">{row.getValue("name")}</span> },
    { accessorKey: "purchaseCost", header: "Cost", cell: ({ row }) => <span>{currencySymbol}{row.original.purchaseCost.toFixed(2)}</span> },
    { accessorKey: "currentValue", header: "Current Value", cell: ({ row }) => <span className="font-bold text-blue-600">{currencySymbol}{row.original.currentValue.toFixed(2)}</span> },
    { accessorKey: "condition", header: "Condition", cell: ({ row }) => <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 uppercase">{row.original.condition}</span> },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-1.5">
            <button onClick={() => onEdit(item)} className="p-1.5 text-neutral-500 hover:text-blue-600 rounded-lg transition cursor-pointer" title="Edit"><Edit2 size={15} /></button>
            <button onClick={() => onDelete(item)} className="p-1.5 text-neutral-500 hover:text-red-600 rounded-lg transition cursor-pointer" title="Delete"><Trash2 size={15} /></button>
          </div>
        );
      },
    },
  ];
  const table = useReactTable({ data: assets, columns, getCoreRowModel: getCoreRowModel() });
  return <DataTable table={table} columns={columns} />;
}