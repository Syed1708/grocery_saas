"use client";

import { useState } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Plus, RotateCcw, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/common/data-table/DataTable";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import Modal from "@/components/common/Modal";
import { createSaleReturnAction, searchSaleForReturnAction } from "@/app/actions/return-actions";
import { ISaleReturn, IReturnableSale, IReturnableSaleItem } from "@/types";

interface ReturnsClientProps {
  data: ISaleReturn[];
  currencySymbol?: string;
}

export default function ReturnsClient({
  data,
  currencySymbol = "৳",
}: ReturnsClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [searchInvoiceNo, setSearchInvoiceNo] = useState("");
  const [searchedSale, setSearchedSale] = useState<IReturnableSale | null>(null);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);

  // Search invoice and load only items eligible for return
  async function handleSearchInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!searchInvoiceNo.trim()) return;

    setSearching(true);
    const res = await searchSaleForReturnAction(searchInvoiceNo);
    setSearching(false);

    if (res.success && res.sale) {
      setSearchedSale(res.sale as IReturnableSale);
      toast.success(`Found invoice #${res.sale.invoiceNo}`);
    } else {
      setSearchedSale(null);
      toast.error(res.error || "Invoice not found or all items already returned.");
    }
  }

  // Submit return
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
        <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
          #{row.getValue("invoiceNo")}
        </span>
      ),
    },
    {
      accessorKey: "customerName",
      header: "Customer",
      cell: ({ row }) => <span className="font-medium text-xs">{row.getValue("customerName")}</span>,
    },
    {
      accessorKey: "totalRefund",
      header: "Refund Amount",
      cell: ({ row }) => (
        <span className="font-bold text-xs text-red-600 font-mono">
          {currencySymbol}{Number(row.getValue("totalRefund")).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: "refundMethod",
      header: "Refund Method",
      cell: ({ row }) => {
        const method = row.getValue("refundMethod") as string;
        const isCash = method?.toLowerCase() === "cash";
        return (
          <span
            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
              isCash
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                : "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
            }`}
          >
            {isCash ? "Cash (ক্যাশ)" : "Balance (বাকি সমন্বয়)"}
          </span>
        );
      },
    },
    {
      accessorKey: "returnDate",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-neutral-500 text-xs font-mono">
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
          onClick={() => {
            setSearchedSale(null);
            setSearchInvoiceNo("");
            setModalOpen(true);
          }}
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
        title="Process Sales Return (পণ্য ফেরত গ্রহণ)"
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
              className="px-4 py-2 bg-neutral-900 dark:bg-neutral-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {searching ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Searching...
                </>
              ) : (
                "Find Invoice"
              )}
            </button>
          </form>

          {/* Loaded Invoice Items Form */}
          {searchedSale && (
            <form onSubmit={handleReturnSubmit} className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs flex justify-between items-center">
                <div>
                  <span className="text-neutral-400 block text-[10px] uppercase font-bold">Invoice</span>
                  <strong className="font-mono text-neutral-900 dark:text-neutral-100">
                    #{searchedSale.invoiceNo}
                  </strong>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[10px] uppercase font-bold">Customer</span>
                  <strong className="text-neutral-900 dark:text-neutral-100">{searchedSale.customerName}</strong>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[10px] uppercase font-bold">Grand Total</span>
                  <strong className="font-mono text-neutral-900 dark:text-neutral-100">
                    {currencySymbol}{searchedSale.grandTotal.toFixed(2)}
                  </strong>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    ফেরতযোগ্য পণ্যের তালিকা (Eligible Items):
                  </span>
                  <span className="text-[11px] text-neutral-400 font-mono">
                    {searchedSale.items.length} item(s) available
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {searchedSale.items.map((it: IReturnableSaleItem) => (
                    <div
                      key={it.id}
                      className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                            {it.productName}
                          </span>
                          <span className="text-neutral-400 text-[10px] font-mono">
                            মূল বিক্রয়: {it.totalSoldQty} {it.unitCode} @ {currencySymbol}{it.unitPrice.toFixed(2)}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded">
                            বাকি আছে: {it.remainingQty} {it.unitCode}
                          </span>
                          {it.alreadyReturnedQty > 0 && (
                            <span className="block text-[9px] text-amber-600 dark:text-amber-400 mt-0.5">
                              (পূর্বে ফেরত: {it.alreadyReturnedQty})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                        <div>
                          <label className="block text-[10px] text-neutral-400 font-bold mb-1">
                            ফেরত পরিমাণ (Max: {it.remainingQty}) *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={it.remainingQty}
                            defaultValue={0}
                            name={`return_qty_${it.id}`}
                            className="w-full px-2.5 py-1 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none font-bold font-mono focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-neutral-400 font-bold mb-1">
                            পণ্যের অবস্থা (Condition)
                          </label>
                          <select
                            name={`condition_${it.id}`}
                            className="w-full px-2.5 py-1 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none cursor-pointer"
                          >
                            <option value="RESTOCK">পুনরায় বিক্রয়যোগ্য (Restock)</option>
                            <option value="DAMAGED">নষ্ট / মেয়াদোত্তীর্ণ (Damaged Loss)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Refund Method & Notes */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    টাকা ফেরতের মাধ্যম (Refund Method)
                  </label>
                  <select
                    name="refundMethod"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none cursor-pointer font-medium"
                  >
                    <option value="cash">ক্যাশ ড্রয়ার থেকে নগদ ফেরত (Cash)</option>
                    <option value="balance">কাস্টমারের বাকি খাতা থেকে কর্তন (Balance)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    ফেরতের কারণ (Return Reason)
                  </label>
                  <input
                    type="text"
                    name="notes"
                    placeholder="e.g. নষ্ট পণ্য / ভুল সাইজ"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition cursor-pointer"
                >
                  বাতিল (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "প্রসেস হচ্ছে..." : "ফেরত নিশ্চিত করুন (Confirm Return)"}
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
}