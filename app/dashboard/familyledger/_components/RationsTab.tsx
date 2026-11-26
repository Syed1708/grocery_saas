"use client";
"use no memo";

import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { ColumnDef, getCoreRowModel, getPaginationRowModel, useReactTable } from "@tanstack/react-table";
import { Printer } from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";
import { TableActions } from "@/components/common/ui/table/TableHelpers";
import { IPartnerRation, PERMISSIONS } from "@/types";
import { format } from "date-fns";
import RationInvoicePdf from "./RationInvoicePdf";

export default function RationsTab({
  rations,
  currencySymbol = "৳",
  shop,
  branchName,
  onEdit,
  onDelete,
}: {
  rations: IPartnerRation[];
  currencySymbol?: string;
  shop: { name: string; phone?: string | null; address?: string | null };
  branchName: string;
  onEdit: (r: IPartnerRation) => void;
  onDelete: (r: IPartnerRation) => void;
}) {
  const [printRation, setPrintRation] = useState<IPartnerRation | null>(null);

  useEffect(() => {
    const clearAfterPrint = () => setPrintRation(null);
    window.addEventListener("afterprint", clearAfterPrint);
    return () => window.removeEventListener("afterprint", clearAfterPrint);
  }, []);

  const printRationPdf = (ration: IPartnerRation) => {
    flushSync(() => setPrintRation(ration));
    window.print();
  };

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
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => printRationPdf(row.original)}
            className="inline-flex items-center gap-1 px-1.5 py-1 rounded-lg text-[10px] font-bold text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition cursor-pointer"
            title="Print ration invoice PDF"
          >
            <Printer size={13} /> PDF
          </button>
          <TableActions
            onEdit={() => onEdit(row.original)}
            editPermission={PERMISSIONS.FAMILY_LEDGER_ACCESS}
            onDelete={() => onDelete(row.original)}
            deletePermission={PERMISSIONS.FAMILY_LEDGER_ACCESS}
          />
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: rations,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
  return (
    <>
      <DataTable table={table} columns={columns} />
      {printRation && (
        <RationInvoicePdf
          ration={printRation}
          currencySymbol={currencySymbol}
          shop={shop}
          branchName={branchName}
        />
      )}
    </>
  );
}