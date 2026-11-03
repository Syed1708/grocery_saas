"use client";

import { useState, useMemo } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Receipt, Printer, Eye, Trash2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/common/data-table/DataTable";
import { DataTableViewOptions } from "@/components/common/data-table/DataTableViewOptions";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import Modal from "@/components/common/Modal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import SaleInvoiceReceipt from "./SaleInvoiceReceipt";
import SalesFilters from "./SalesFilters";
import { ISale, IPosShopConfig } from "@/types/sale";
import { voidSaleAction } from "@/app/actions/sale-actions";

export default function SalesClient({
  data = [],
  shop,
  currencySymbol = "৳",
  userRole = "OWNER",
}: {
  data: ISale[];
  shop: IPosShopConfig;
  currencySymbol?: string;
  userRole?: string;
}) {
  const [selectedSale, setSelectedSale] = useState<ISale | null>(null);
  const [printSale, setPrintSale] = useState<ISale | null>(null);
  const [voidTarget, setVoidTarget] = useState<ISale | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedInvoice, setCopiedInvoice] = useState<string | null>(null);
const handleCopyInvoice = (invNo: string) => {
  navigator.clipboard.writeText(invNo);
  setCopiedInvoice(invNo);
  toast.success(`ইনভয়েস #${invNo} ক্লিপবোর্ডে কপি করা হয়েছে!`);
  setTimeout(() => setCopiedInvoice(null), 1800);
};

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");

  const handlePrint = (sale: ISale) => {
    setPrintSale(sale);
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
      }, 50);
    });
  };

  async function handleVoidSale() {
    if (!voidTarget) return;
    setLoading(true);
    const res = await voidSaleAction(voidTarget.id);
    setLoading(false);

    if (res.success) {
      toast.success(`চালান #${voidTarget.invoiceNo} সফলভাবে বাতিল ও স্টক সমন্বয় করা হয়েছে!`);
      setVoidTarget(null);
    } else {
      toast.error(res.error || "চালান বাতিল করা সম্ভব হয়নি।");
    }
  }

  // Reactive Multi-Filter Logic
  const filteredData = useMemo(() => {
    return data.filter((s) => {
      // 1. Text Search (Invoice, Customer Name, Phone)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesInv = s.invoiceNo.toLowerCase().includes(q);
        const matchesCust = s.customerName?.toLowerCase().includes(q);
        const matchesPhone = s.customerPhone?.includes(q);
        if (!matchesInv && !matchesCust && !matchesPhone) return false;
      }

      // 2. Status Filter
      if (statusFilter !== "all" && s.paymentStatus.toLowerCase() !== statusFilter) {
        return false;
      }

      // 3. Payment Method Filter
      if (methodFilter !== "all" && s.paymentMethod.toLowerCase() !== methodFilter) {
        return false;
      }

      return true;
    });
  }, [data, searchQuery, statusFilter, methodFilter]);

  const columns = useMemo<ColumnDef<ISale>[]>(
    () => [
{
  accessorKey: "invoiceNo",
  header: "ইনভয়েস #",
  cell: ({ row }) => {
    const invNo = row.getValue("invoiceNo") as string;
    const isCopied = copiedInvoice === invNo;

    return (
      <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-neutral-900 dark:text-neutral-100 group">
        <Receipt size={13} className="text-neutral-400" />
        <span>#{invNo}</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleCopyInvoice(invNo);
          }}
          className="p-1 rounded text-neutral-400 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          title="কপি করুন"
        >
          {isCopied ? (
            <Check size={12} className="text-emerald-600" />
          ) : (
            <Copy size={12} className="opacity-60 group-hover:opacity-100" />
          )}
        </button>
      </div>
    );
  }
  },
      {
        accessorKey: "customerName",
        header: "কাস্টমার",
        cell: ({ row }) => (
          <div>
            <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">
              {row.getValue("customerName")}
            </span>
            {row.original.customerPhone && (
              <span className="text-[11px] text-neutral-400 font-mono">
                {row.original.customerPhone}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "grandTotal",
        header: "মোট বিল",
        cell: ({ row }) => (
          <span className="font-black text-neutral-900 dark:text-neutral-100 font-mono">
            {currencySymbol}{Number(row.getValue("grandTotal") || 0).toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: "paymentStatus",
        header: "পেমেন্ট অবস্থা",
        cell: ({ row }) => {
          const status = row.original.paymentStatus;
          const due = Number(row.original.dueAmount || 0);
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
              {status} {due > 0 && `(বাকি: ${currencySymbol}${due.toFixed(2)})`}
            </span>
          );
        },
      },
      {
        accessorKey: "cashierName",
        header: "ক্যাশিয়ার",
        cell: ({ row }) => (
          <span className="text-xs text-neutral-500">{row.getValue("cashierName")}</span>
        ),
      },
      {
        accessorKey: "saleDate",
        header: "তারিখ",
        cell: ({ row }) => (
          <span className="text-neutral-500 text-xs font-mono">
            {new Date(row.original.saleDate).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: "actions",
        header: "অ্যাকশন",
        cell: ({ row }) => {
          const sale = row.original;
          return (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedSale(sale)}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                title="বিস্তারিত দেখুন"
              >
                <Eye size={15} />
              </button>
              <button
                type="button"
                onClick={() => handlePrint(sale)}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-purple-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                title="রসিদ প্রিন্ট"
              >
                <Printer size={15} />
              </button>
              {/* 🛡️ OWNER-ONLY VOID BUTTON */}
              {userRole === "OWNER" && (
                <button
                  type="button"
                  onClick={() => setVoidTarget(sale)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                  title="চালান বাতিল করুন (Void)"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [currencySymbol, userRole]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="space-y-4 print:hidden">
        <Breadcrumbs items={[{ label: "বিক্রয় ও পিওএস" }, { label: "বিক্রয় চালান তালিকা" }]} />

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              বিক্রয় চালান ইতিহাস (Sales Invoices)
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              সম্পন্ন হওয়া সকল বিক্রয় রসিদ পর্যালোচনা, ফিল্টারিং ও পুনরায় প্রিন্ট করুন
            </p>
          </div>
          <DataTableViewOptions table={table} />
        </div>

        {/* 👈 Dynamic Filter & Search Toolbar */}
        <SalesFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          methodFilter={methodFilter}
          onMethodChange={setMethodFilter}
          onReset={() => {
            setSearchQuery("");
            setStatusFilter("all");
            setMethodFilter("all");
          }}
          totalFilteredCount={filteredData.length}
        />

        <DataTable table={table} columns={columns} />

        {/* View Invoice Modal */}
        {selectedSale && (
          <Modal
            isOpen={Boolean(selectedSale)}
            onClose={() => setSelectedSale(null)}
            title={`চালান #${selectedSale.invoiceNo}`}
            description={`ক্যাশিয়ার: ${selectedSale.cashierName} • তারিখ: ${new Date(selectedSale.saleDate).toLocaleDateString()}`}
            maxWidth="md"
          >
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span className="text-neutral-500">গ্রাহক:</span>
                  <strong className="text-neutral-900 dark:text-neutral-100">{selectedSale.customerName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">শাখা:</span>
                  <span className="font-semibold">{selectedSale.branchName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">পেমেন্ট মাধ্যম:</span>
                  <span className="uppercase font-bold">{selectedSale.paymentMethod}</span>
                </div>
              </div>

              <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-neutral-100 dark:bg-neutral-800 text-[10px] uppercase font-bold text-neutral-500">
                    <tr>
                      <th className="p-2">পণ্য</th>
                      <th className="p-2 text-center">পরিমাণ</th>
                      <th className="p-2 text-right">মোট</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {selectedSale.items.map((it) => (
                      <tr key={it.id}>
                        <td className="p-2 font-medium">{it.productName}</td>
                        <td className="p-2 text-center font-mono">{it.quantity} {it.unitCode}</td>
                        <td className="p-2 text-right font-mono font-bold">
                          {currencySymbol}{Number(it.lineTotal || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl space-y-1 font-mono">
                <div className="flex justify-between">
                  <span>সাবটোটাল:</span>
                  <span>{currencySymbol}{Number(selectedSale.subtotal || 0).toFixed(2)}</span>
                </div>
                {selectedSale.discount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>ছাড়:</span>
                    <span>-{currencySymbol}{Number(selectedSale.discount || 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-neutral-200 dark:border-neutral-700">
                  <span>সর্বমোট বিল:</span>
                  <span>{currencySymbol}{Number(selectedSale.grandTotal || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handlePrint(selectedSale)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer size={15} /> প্রিন্ট রসিদ
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSale(null)}
                  className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold rounded-xl hover:bg-neutral-200 transition cursor-pointer"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* 👈 Atomic Void Confirmation Dialog */}
        <ConfirmDialog
          isOpen={Boolean(voidTarget)}
          onClose={() => setVoidTarget(null)}
          onConfirm={handleVoidSale}
          title="চালান বাতিল করুন (Void Sale)"
          message={`আপনি কি নিশ্চিতভাবে চালান #${voidTarget?.invoiceNo} বাতিল করতে চান? এর ফলে মালামাল পুনরায় স্টক অ্যাকাউন্টে যোগ হবে এবং ক্যাশ ড্রয়ার/কাস্টমার বাকি সমন্বয় করা হবে।`}
          loading={loading}
        />
      </div>

      <SaleInvoiceReceipt
        sale={printSale}
        shop={shop}
        currencySymbol={currencySymbol}
      />
    </div>
  );
}