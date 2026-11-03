"use client";

import { useState } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Plus, RotateCcw, Search, Loader2, Printer, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/common/data-table/DataTable";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import Modal from "@/components/common/Modal";
import { createSaleReturnAction, searchSaleForReturnAction } from "@/app/actions/return-actions";
import { ISaleReturn, IReturnableSale, IReturnableSaleItem, ICompletedReturn, IPosShopConfig } from "@/types/sale";
import ReturnReceiptThermalPrint from "./ReturnReceiptThermalPrint";

interface ReturnsClientProps {
  data: ISaleReturn[];
  shop: IPosShopConfig;
  currencySymbol?: string;
}

export default function ReturnsClient({
  data = [],
  shop,
  currencySymbol = "৳",
}: ReturnsClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [searchInvoiceNo, setSearchInvoiceNo] = useState("");
  const [searchedSale, setSearchedSale] = useState<IReturnableSale | null>(null);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);

  const [completedReturn, setCompletedReturn] = useState<ICompletedReturn | null>(null);

  // Search invoice and load only items eligible for return
  async function handleSearchInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!searchInvoiceNo.trim()) return;

    setSearching(true);
    const res = await searchSaleForReturnAction(searchInvoiceNo.trim());
    setSearching(false);

    if (res.success && res.sale) {
      setSearchedSale(res.sale as IReturnableSale);
      toast.success(`চালান #${res.sale.invoiceNo} পাওয়া গেছে!`);
    } else {
      setSearchedSale(null);
      toast.error(res.error || "চালান পাওয়া যায়নি অথবা সকল পণ্য ইতোমধ্যে ফেরত নেওয়া হয়েছে।");
    }
  }

  // Submit return with zero-quantity validation
  async function handleReturnSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!searchedSale) return;

    const formData = new FormData(e.currentTarget);
    formData.append("saleId", searchedSale.id);

    // Validate that at least ONE item has quantity > 0
    let hasReturnedItems = false;
    for (const item of searchedSale.items) {
      const qty = Number(formData.get(`return_qty_${item.id}`) || 0);
      if (qty > 0) {
        hasReturnedItems = true;
        break;
      }
    }

    if (!hasReturnedItems) {
      toast.error("অনুগ্রহ করে অন্তত একটি পণ্যের ফেরত পরিমাণ উল্লেখ করুন!");
      return;
    }

    setLoading(true);
    const res = await createSaleReturnAction(formData);
    setLoading(false);

    if (res.success) {
      toast.success("পণ্য ফেরত সফল হয়েছে এবং স্টক ও ব্যালেন্স সমন্বয় করা হয়েছে!");
      setModalOpen(false);
      setSearchedSale(null);
      setSearchInvoiceNo("");

      // 👈 Opens the completed voucher receipt modal!
      setCompletedReturn(res.returnData as ICompletedReturn);
    } else {
      toast.error(res.error || "পণ্য ফেরত সম্পন্ন করা যায়নি।");
    }
  }

  const columns: ColumnDef<ISaleReturn>[] = [
    {
      accessorKey: "returnNo",
      header: "রিটার্ন #",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
          <RotateCcw size={13} className="text-neutral-400" />
          #{row.getValue("returnNo")}
        </span>
      ),
    },
    {
      accessorKey: "invoiceNo",
      header: "মূল ইনভয়েস",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
          #{row.getValue("invoiceNo")}
        </span>
      ),
    },
    {
      accessorKey: "customerName",
      header: "কাস্টমার",
      cell: ({ row }) => <span className="font-medium text-xs">{row.getValue("customerName")}</span>,
    },
    {
      accessorKey: "totalRefund",
      header: "রিফান্ড পরিমাণ",
      cell: ({ row }) => (
        <span className="font-bold text-xs text-red-600 font-mono">
          {currencySymbol}{Number(row.getValue("totalRefund") || 0).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: "refundMethod",
      header: "রিফান্ড মাধ্যম",
      cell: ({ row }) => {
        const method = (row.getValue("refundMethod") as string)?.toLowerCase();
        const isCash = method === "cash";
        return (
          <span
            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${isCash
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
              : "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
              }`}
          >
            {isCash ? "নগদ (Cash Refund)" : "বাকি সমন্বয় (Balance Deduction)"}
          </span>
        );
      },
    },
    {
      accessorKey: "returnDate",
      header: "তারিখ",
      cell: ({ row }) => (
        <span className="text-neutral-500 text-xs font-mono">
          {new Date(row.original.returnDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "অ্যাকশন",
      cell: ({ row }) => {
        const ret = row.original;
        return (
          <button
            type="button"
            onClick={() => {
              // Construct return object and trigger print
              setCompletedReturn({
                returnNo: ret.returnNo,
                invoiceNo: ret.invoiceNo,
                returnDate: ret.returnDate,
                customerName: ret.customerName,
                totalRefund: ret.totalRefund,
                refundMethod: ret.refundMethod,
                branchName: "Main Branch",
                cashierName: "Staff",
                items: [],
              });
              setTimeout(() => window.print(), 100);
            }}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-purple-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            title="রিটার্ন রসিদ প্রিন্ট করুন"
          >
            <Printer size={15} />
          </button>
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

  // Check conditions
  const isWalkIn =
    !searchedSale?.customerId ||
    searchedSale?.customerType === "WALK_IN" ||
    searchedSale?.customerName?.includes("Walk-in") ||
    searchedSale?.customerName?.includes("খুচরা");

  const customerCurrentDue = Number(searchedSale?.customerDue || 0);
  const canUseBalance = !isWalkIn && customerCurrentDue > 0;

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: "বিক্রয় ও পিওএস" }, { label: "পণ্য ফেরত ও রিফান্ড" }]} />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            সেলস রিটার্ন ও রিফান্ড (Sales Returns)
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            বিক্রিত পণ্য ফেরত গ্রহণ, পণ্যের অবস্থা অনুযায়ী স্টক সমন্বয় এবং ক্যাশ/খাতা রিফান্ড
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSearchedSale(null);
            setSearchInvoiceNo("");
            setModalOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
        >
          <Plus size={16} /> নতুন রিটার্ন প্রসেস করুন
        </button>
      </div>

      <DataTable table={table} columns={columns} />

      {/* Process Return Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="পণ্য ফেরত ও রিফান্ড প্রসেস (Sales Return)"
        description="ইনভয়েস নম্বর দিয়ে চালান খুঁজুন এবং ফেরতযোগ্য পণ্য সিলেক্ট করুন।"
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
                placeholder="ইনভয়েস নম্বর লিখুন (e.g. INV-26001)..."
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
                  <Loader2 size={13} className="animate-spin" /> খোঁজা হচ্ছে...
                </>
              ) : (
                "চালান খুঁজুন"
              )}
            </button>
          </form>

          {/* Loaded Invoice Items Form */}
          {searchedSale && (
            <form onSubmit={handleReturnSubmit} className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs flex justify-between items-center">
                <div>
                  <span className="text-neutral-400 block text-[10px] uppercase font-bold">ইনভয়েস</span>
                  <strong className="font-mono text-neutral-900 dark:text-neutral-100">
                    #{searchedSale.invoiceNo}
                  </strong>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[10px] uppercase font-bold">কাস্টমার</span>
                  <strong className="text-neutral-900 dark:text-neutral-100">{searchedSale.customerName}</strong>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[10px] uppercase font-bold">মোট বিল</span>
                  <strong className="font-mono text-neutral-900 dark:text-neutral-100">
                    {currencySymbol}{searchedSale.grandTotal.toFixed(2)}
                  </strong>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    ফেরতযোগ্য পণ্যের তালিকা:
                  </span>
                  <span className="text-[11px] text-neutral-400 font-mono">
                    {searchedSale.items.length} টি পণ্য ফেরতযোগ্য
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
                            বিক্রিত: {it.totalSoldQty} {it.unitCode} @ {currencySymbol}{it.unitPrice.toFixed(2)}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded">
                            ফেরত বাকি: {it.remainingQty} {it.unitCode}
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
                            ফেরতের পরিমাণ (সর্বোচ্চ: {it.remainingQty}) *
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
                            পণ্যের অবস্থা (Stock Condition)
                          </label>
                          <select
                            name={`condition_${it.id}`}
                            className="w-full px-2.5 py-1 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none cursor-pointer"
                          >
                            <option value="RESTOCK">পুনরায় বিক্রয়যোগ্য (Restock to Shelf)</option>
                            <option value="DAMAGED">নষ্ট / ড্যামেজ (Write-off Loss)</option>
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
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      টাকা ফেরতের মাধ্যম *
                    </label>
                    {!isWalkIn && (
                      <span className="text-[10px] font-bold text-neutral-500">
                        বর্তমান বাকি: <strong className={customerCurrentDue > 0 ? "text-red-600" : "text-emerald-600"}>৳{customerCurrentDue.toFixed(2)}</strong>
                      </span>
                    )}
                  </div>

                  <select
                    name="refundMethod"
                    defaultValue="cash"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none cursor-pointer font-medium"
                  >
                    <option value="cash">ক্যাশ ড্রয়ার থেকে নগদ ফেরত (Cash Refund)</option>

                    {/* 🛡️ Dynamically disabled with explanatory status label */}
                    <option value="balance" disabled={!canUseBalance}>
                      {isWalkIn
                        ? "বাকি সমন্বয় (খুচরা ক্রেতার ক্ষেত্রে প্রযোজ্য নয়)"
                        : customerCurrentDue <= 0
                          ? "বাকি সমন্বয় (কাস্টমারের কোনো বকেয়া বাকি নেই)"
                          : `বাকি খাতা থেকে কর্তন (বকেয়া আছে: ৳${customerCurrentDue.toFixed(2)})`}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    ফেরতের কারণ
                  </label>
                  <input
                    type="text"
                    name="notes"
                    placeholder="যেমন: মেয়াদোত্তীর্ণ / ভুল পণ্য নেওয়া হয়েছিল"
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
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "প্রসেস হচ্ছে..." : "ফেরত নিশ্চিত করুন"}
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>


      {completedReturn && (
        <Modal
          isOpen={Boolean(completedReturn)}
          onClose={() => setCompletedReturn(null)}
          title="পণ্য ফেরত সফল হয়েছে! (Return Completed)"
          description={`রিটার্ন ভাউচার নম্বর: #${completedReturn.returnNo}`}
          maxWidth="sm"
        >
          <div className="space-y-4 text-center">
            <div className="inline-flex p-3 rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={32} />
            </div>

            <div>
              <span className="text-2xl font-black block font-mono text-neutral-900 dark:text-neutral-100">
                {currencySymbol}{completedReturn.totalRefund.toFixed(2)}
              </span>
              <span className="text-xs text-neutral-500 font-semibold block mt-1">
                {completedReturn.refundMethod === "cash" ? "নগদ ক্যাশ ফেরত প্রদান করা হয়েছে" : "বাকি খাতা থেকে কর্তন করা হয়েছে"}
              </span>
              <span className="text-[11px] font-mono text-neutral-400 block mt-0.5">
                গ্রাহক: {completedReturn.customerName}
              </span>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer size={15} /> প্রিন্ট রিটার্ন স্লিপ ({shop.thermalWidth})
              </button>
              <button
                type="button"
                onClick={() => setCompletedReturn(null)}
                className="w-full py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold text-xs rounded-xl hover:bg-neutral-200 cursor-pointer"
              >
                সম্পন্ন (Done)
              </button>
            </div>
          </div>
        </Modal>
      )}

      <ReturnReceiptThermalPrint returnData={completedReturn} shop={shop} />

    </div>



  );


}