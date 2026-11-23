"use client";
"use no memo";
import { ColumnDef, getCoreRowModel, getPaginationRowModel, useReactTable } from "@tanstack/react-table";
import { DataTable } from "@/components/common/data-table/DataTable";
import { TableActions } from "@/components/common/ui/table/TableHelpers";
import { ICompanyAsset, PERMISSIONS } from "@/types";

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
      cell: ({ row }) => (
        <TableActions
          onEdit={() => onEdit(row.original)}
          editPermission={PERMISSIONS.FINANCE_EXPENSES}
          onDelete={() => onDelete(row.original)}
          deletePermission={PERMISSIONS.FINANCE_EXPENSES}
        />
      ),
    },
  ];
  const table = useReactTable({ data: assets, columns, getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel() });
  return <DataTable table={table} columns={columns} />;
}
