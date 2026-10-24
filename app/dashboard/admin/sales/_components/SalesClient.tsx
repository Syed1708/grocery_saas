"use client";
"use no memo";

import { useState } from "react";
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
import { ISale } from "@/types";

export default function SalesClient({
  data,
  shop,
  currencySymbol = "৳",
}: {
  data: ISale[];
  shop: any;
  currencySymbol?: string;
}) {
  const [selectedSale, setSelectedSale] = useState<ISale | null>(null);

  function printReceipt(sale: ISale) {
    const printWindow = window.open("", "_blank", "width=420,height=600");
    if (!printWindow) return;

    const itemsHtml = sale.items
      .map(
        (it) => `
        <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:11px;">
          <div style="flex:1;">${it.productName}<br/><span style="color:#666;">${it.quantity} x ${currencySymbol}${it.unitPrice.toFixed(2)}</span></div>
          <div style="font-weight:bold;">${currencySymbol}${it.lineTotal.toFixed(2)}</div>
        </div>
      `
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt #${sale.invoiceNo}</title>
        <style>
          @page { size: ${shop?.thermalWidth || "80mm"} auto; margin: 0; }
          body { font-family: monospace; width: ${shop?.thermalWidth || "80mm"}; margin: 0 auto; padding: 10px; font-size: 11px; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .row { display: flex; justify-content: space-between; margin: 2px 0; }
        </style>
      </head>
      <body>
        <div class="center bold" style="font-size:14px;">${shop?.name || "Grocery Store"}</div>
        <div class="center" style="font-size:10px;">${shop?.address || ""}</div>
        <div class="center" style="font-size:10px;">Phone: ${shop?.phone || ""}</div>
        <div class="divider"></div>
        <div class="row"><span>Invoice: #${sale.invoiceNo}</span><span>${new Date(sale.saleDate).toLocaleDateString()}</span></div>
        <div class="row"><span>Cashier: ${sale.cashierName}</span><span>Branch: ${sale.branchName}</span></div>
        <div class="row"><span>Customer: ${sale.customerName}</span><span>${sale.customerPhone || ""}</span></div>
        <div class="divider"></div>
        ${itemsHtml}
        <div class="divider"></div>
        <div class="row"><span>Subtotal:</span><span>${currencySymbol}${sale.subtotal.toFixed(2)}</span></div>
        ${sale.discount > 0 ? `<div class="row"><span>Discount:</span><span>-${currencySymbol}${sale.discount.toFixed(2)}</span></div>` : ""}
        ${sale.vatAmount > 0 ? `<div class="row"><span>VAT:</span><span>+${currencySymbol}${sale.vatAmount.toFixed(2)}</span></div>` : ""}
        <div class="row bold" style="font-size:13px;"><span>GRAND TOTAL:</span><span>${currencySymbol}${sale.grandTotal.toFixed(2)}</span></div>
        <div class="row"><span>Paid:</span><span>${currencySymbol}${sale.paidAmount.toFixed(2)}</span></div>
        <div class="row"><span>Change:</span><span>${currencySymbol}${sale.changeAmount.toFixed(2)}</span></div>
        ${sale.dueAmount > 0 ? `<div class="row bold" style="color:red;"><span>Due Debt:</span><span>${currencySymbol}${sale.dueAmount.toFixed(2)}</span></div>` : ""}
        <div class="divider"></div>
        <div class="center" style="font-size:10px; margin-top:8px;">${shop?.invoiceFooter || "ধন্যবাদ আবার আসবেন!"}</div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }

  const columns: ColumnDef<ISale>[] = [
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
        <span className="text-neutral-500 text-xs">
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
              onClick={() => setSelectedSale(sale)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="View Bill Details"
            >
              <Eye size={15} />
            </button>
            <button
              onClick={() => printReceipt(sale)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-purple-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="Print Thermal Receipt"
            >
              <Printer size={15} />
            </button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
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

      {/* View Bill Modal */}
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
                <span>{selectedSale.branchName}</span>
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
                      <td className="p-2 text-center">{it.quantity}</td>
                      <td className="p-2 text-right font-mono font-bold">{currencySymbol}{it.lineTotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{currencySymbol}{selectedSale.subtotal.toFixed(2)}</span>
              </div>
              {selectedSale.discount > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Discount:</span>
                  <span>-{currencySymbol}{selectedSale.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-neutral-200 dark:border-neutral-700">
                <span>Grand Total:</span>
                <span>{currencySymbol}{selectedSale.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => printReceipt(selectedSale)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer size={15} /> Print Thermal Slip
              </button>
              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold rounded-xl hover:bg-neutral-200 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}