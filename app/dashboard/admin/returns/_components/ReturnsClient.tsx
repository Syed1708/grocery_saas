"use client";
"use no memo";

import { useState } from "react";
import { ColumnDef, getCoreRowModel, getPaginationRowModel, useReactTable } from "@tanstack/react-table";
import { Plus, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/common/data-table/DataTable";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import Modal from "@/components/common/Modal";
import { createSaleReturnAction, searchSaleForReturnAction } from "@/app/actions/return-actions";
import { ISaleReturn } from "@/types";

export default function ReturnsClient({
  data,
  shopId,
  currencySymbol = "৳",
}: {
  data: ISaleReturn[];
  shopId: string;
  currencySymbol?: string;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [searchInvoiceNo, setSearchInvoiceNo] = useState("");
  const [searchedSale, setSearchedSale] = useState<any | null>(null);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);

// Inside ReturnsClient component, update handleSearchInvoice:
async function handleSearchInvoice(e: React.FormEvent) {
  e.preventDefault();
  if (!searchInvoiceNo.trim()) return;

  setSearching(true);
  const res = await searchSaleForReturnAction(searchInvoiceNo);
  setSearching(false);

  if (res.success && res.sale) {
    setSearchedSale(res.sale);
    toast.success(`Found invoice #${res.sale.invoiceNo}`);
  } else {
    setSearchedSale(null);
    toast.error(res.error || "Invoice not found in system.");
  }
}

  async function handleReturnSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!searchedSale) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.append("saleId", searchedSale.id);

    const res = await createSaleReturnAction(formData);
    setLoading(false);

    if (res.success) {
      toast.success("Sales return processed & inventory updated!");
      setModalOpen(false);
      setSearchedSale(null);
      setSearchInvoiceNo("");
    } else {
      toast.error(res.error || "Failed to process return.");
    }
  }

  const columns: ColumnDef<ISaleReturn>[] = [
    {
      accessorKey: "returnNo",
      header: "Return #",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
          <RotateCcw size={13} className="text-neutral-400" />
          #{row.getValue("returnNo")}
        </span>
      ),
    },
    {
      accessorKey: "invoiceNo",
      header: "Original Invoice",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-blue-600">
          #{row.getValue("invoiceNo")}
        </span>
      ),
    },
    {
      accessorKey: "customerName",
      header: "Customer",
      cell: ({ row }) => <span className="font-medium">{row.getValue("customerName")}</span>,
    },
    {
      accessorKey: "totalRefund",
      header: "Refund Amount",
      cell: ({ row }) => (
        <span className="font-bold text-red-600 font-mono">
          {currencySymbol}{Number(row.getValue("totalRefund")).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: "refundMethod",
      header: "Refund Method",
      cell: ({ row }) => (
        <span className="text-xs uppercase font-bold text-neutral-600 dark:text-neutral-300">
          {row.getValue("refundMethod")}
        </span>
      ),
    },
    {
      accessorKey: "returnDate",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-neutral-500 text-xs">
          {new Date(row.original.returnDate).toLocaleDateString()}
        </span>
      ),
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
      <Breadcrumbs items={[{ label: "Sales & POS" }, { label: "Sales Returns" }]} />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            Sales Returns &amp; Refunds (পণ্য ফেরত)
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Accept returned goods, manage restock vs. damaged conditions, and issue refunds
          </p>
        </div>
        <button
          onClick={() => { setSearchedSale(null); setSearchInvoiceNo(""); setModalOpen(true); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
        >
          <Plus size={16} /> Process New Return
        </button>
      </div>

      <DataTable table={table} columns={columns} />

      {/* Process Return Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Process Sales Return"
        description="Search invoice number to load items and specify quantities to return."
        maxWidth="lg"
      >
        <div className="space-y-5">
          {/* Search Bar */}
          <form onSubmit={handleSearchInvoice} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
              <input
                type="text"
                value={searchInvoiceNo}
                onChange={(e) => setSearchInvoiceNo(e.target.value)}
                placeholder="Enter Invoice Number (e.g. INV-10492)..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="px-4 py-2 bg-neutral-800 dark:bg-neutral-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              {searching ? "Searching..." : "Find Invoice"}
            </button>
          </form>

          {/* Loaded Invoice Items Form */}
          {searchedSale && (
            <form onSubmit={handleReturnSubmit} className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs flex justify-between items-center">
                <div>
                  <span className="text-neutral-400 block text-[10px] uppercase font-bold">Invoice</span>
                  <strong className="font-mono text-neutral-900 dark:text-neutral-100">#{searchedSale.invoiceNo}</strong>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[10px] uppercase font-bold">Customer</span>
                  <strong className="text-neutral-900 dark:text-neutral-100">{searchedSale.customerName}</strong>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[10px] uppercase font-bold">Grand Total</span>
                  <strong className="font-mono text-neutral-900 dark:text-neutral-100">{currencySymbol}{searchedSale.grandTotal.toFixed(2)}</strong>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block">
                  Select Items &amp; Return Quantities:
                </span>

                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {searchedSale.items.map((it: any) => (
                    <div key={it.id} className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-neutral-900 dark:text-neutral-100">{it.productName}</span>
                        <span className="text-neutral-400 text-[11px]">Sold Qty: {it.quantity} {it.unitCode} @ {currencySymbol}{it.unitPrice.toFixed(2)}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                        <div>
                          <label className="block text-[10px] text-neutral-400 font-bold mb-1">Return Qty</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={it.quantity}
                            defaultValue={0}
                            name={`return_qty_${it.id}`}
                            className="w-full px-2.5 py-1 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-neutral-400 font-bold mb-1">Item Condition</label>
                          <select
                            name={`condition_${it.id}`}
                            className="w-full px-2.5 py-1 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none cursor-pointer"
                          >
                            <option value="RESTOCK">Restock (Good Condition)</option>
                            <option value="DAMAGED">Damaged (Write-off Loss)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Refund Method */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Refund Method
                  </label>
                  <select
                    name="refundMethod"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none cursor-pointer font-medium"
                  >
                    <option value="cash">Cash Refund (From Drawer)</option>
                    <option value="balance">Deduct from Customer Khata Due</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Return Notes / Reason
                  </label>
                  <input
                    type="text"
                    name="notes"
                    placeholder="e.g. Defective item / wrong size"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Processing..." : "Confirm Return & Restock"}
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
}