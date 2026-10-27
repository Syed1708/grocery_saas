"use client";

import { useState, useMemo } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Receipt, Printer, Eye } from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";
import { DataTableViewOptions } from "@/components/common/data-table/DataTableViewOptions";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import Modal from "@/components/common/Modal";
import SaleInvoiceReceipt from "./SaleInvoiceReceipt";
import { ISale } from "@/types";

export default function SalesClient({
  data = [],
  shop,
  currencySymbol = "৳",
}: {
  data: ISale[];
  shop: any;
  currencySymbol?: string;
}) {
  const [selectedSale, setSelectedSale] = useState<ISale | null>(null);
  const [printSale, setPrintSale] = useState<ISale | null>(null);

  // 👈 Native trigger without browser popup blocker
  const handlePrint = (sale: ISale) => {
    setPrintSale(sale);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const columns = useMemo<ColumnDef<ISale>[]>(
    () => [
      {
        accessorKey: "invoiceNo",
        header: "Invoice #",
        cell: ({ row }) => (
          <span className="font-mono text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
            <Receipt size={13} className="text-neutral-400" />
            #{row.getValue("invoiceNo")}
          </span>
        ),
      },
      {
        accessorKey: "customerName",
        header: "Customer",
        cell: ({ row }) => (
          <div>
            <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">
              {row.getValue("customerName")}
            </span>
            <span className="text-[11px] text-neutral-400">
              {row.original.customerPhone || "Walk-in"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "grandTotal",
        header: "Grand Total",
        cell: ({ row }) => (
          <span className="font-black text-neutral-900 dark:text-neutral-100 font-mono">
            {currencySymbol}{Number(row.getValue("grandTotal")).toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: "paymentStatus",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.paymentStatus;
          return (
            <span
              className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                status === "paid"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                  : status === "partial"
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                  : "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400"
              }`}
            >
              {status} ({currencySymbol}{row.original.dueAmount.toFixed(2)} due)
            </span>
          );
        },
      },
      {
        accessorKey: "cashierName",
        header: "Cashier",
        cell: ({ row }) => <span className="text-xs text-neutral-500">{row.getValue("cashierName")}</span>,
      },
      {
        accessorKey: "saleDate",
        header: "Date",
        cell: ({ row }) => (
          <span className="text-neutral-500 text-xs font-mono">
            {new Date(row.original.saleDate).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const sale = row.original;
          return (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedSale(sale)}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                title="View Bill Details"
              >
                <Eye size={15} />
              </button>
              <button
                type="button"
                onClick={() => handlePrint(sale)}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-purple-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                title="Print Thermal Receipt"
              >
                <Printer size={15} />
              </button>
            </div>
          );
        },
      },
    ],
    [currencySymbol]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      {/* Screen Interface (Hidden during print) */}
      <div className="space-y-4 print:hidden">
        <Breadcrumbs items={[{ label: "Sales & POS" }, { label: "Sales Invoices" }]} />

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              Sales Invoices History (বিক্রয় চালান)
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Review completed store sales, customer payments, and reprint thermal slips
            </p>
          </div>
          <DataTableViewOptions table={table} />
        </div>

        <DataTable table={table} columns={columns} />

        {/* View Bill Details Modal */}
        {selectedSale && (
          <Modal
            isOpen={Boolean(selectedSale)}
            onClose={() => setSelectedSale(null)}
            title={`Invoice #${selectedSale.invoiceNo}`}
            description={`Sold by ${selectedSale.cashierName} on ${new Date(selectedSale.saleDate).toLocaleDateString()}`}
            maxWidth="md"
          >
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Customer:</span>
                  <strong className="text-neutral-900 dark:text-neutral-100">{selectedSale.customerName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Branch:</span>
                  <span className="font-semibold">{selectedSale.branchName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Payment Method:</span>
                  <span className="uppercase font-bold">{selectedSale.paymentMethod}</span>
                </div>
              </div>

              <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-neutral-100 dark:bg-neutral-800 text-[10px] uppercase font-bold text-neutral-500">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {selectedSale.items.map((it) => (
                      <tr key={it.id}>
                        <td className="p-2 font-medium">{it.productName}</td>
                        <td className="p-2 text-center font-mono">{it.quantity}</td>
                        <td className="p-2 text-right font-mono font-bold">
                          {currencySymbol}{Number(it.lineTotal).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl space-y-1 font-mono">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{currencySymbol}{Number(selectedSale.subtotal).toFixed(2)}</span>
                </div>
                {selectedSale.discount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Discount:</span>
                    <span>-{currencySymbol}{Number(selectedSale.discount).toFixed(2)}</span>
                  </div>
                )}
                {selectedSale.vatAmount > 0 && (
                  <div className="flex justify-between text-blue-500">
                    <span>VAT:</span>
                    <span>+{currencySymbol}{Number(selectedSale.vatAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-neutral-200 dark:border-neutral-700">
                  <span>Grand Total:</span>
                  <span>{currencySymbol}{Number(selectedSale.grandTotal).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handlePrint(selectedSale)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer size={15} /> Print Thermal Slip
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSale(null)}
                  className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>

      {/* 👈 Dedicated Thermal Slip Render (Visible only during print) */}
      <SaleInvoiceReceipt
        sale={printSale}
        shop={shop}
        currencySymbol={currencySymbol}
      />
    </div>
  );
}