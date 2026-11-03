// app/dashboard/admin/purchases/_components/modals/ViewInvoiceModal.tsx
"use client";

import Modal from "@/components/common/Modal";
import { Printer } from "lucide-react";

interface ViewInvoiceModalProps {
  invoice: any | null;
  onClose: () => void;
  onPrint: (invoice: any) => void;
  currencySymbol?: string;
}

export default function ViewInvoiceModal({
  invoice,
  onClose,
  onPrint,
  currencySymbol = "৳",
}: ViewInvoiceModalProps) {
  if (!invoice) return null;

  return (
    <Modal
      isOpen={Boolean(invoice)}
      onClose={onClose}
      title={`Purchase Bill #${invoice.chalanNo}`}
      description={`Stock Inward details for ${invoice.supplierCompany || invoice.supplierName}`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-neutral-400 block text-[10px] uppercase font-bold">Supplier</span>
            <span className="font-semibold">{invoice.supplierCompany || invoice.supplierName}</span>
          </div>
          <div>
            <span className="text-neutral-400 block text-[10px] uppercase font-bold">Inward Date</span>
            <span>{new Date(invoice.purchaseDate).toLocaleDateString()}</span>
          </div>
        </div>

        {/* 5-Line Khata Ledger Card */}
        <div className="p-4 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-neutral-500">Current Bill Total (আজকের চালান):</span>
            <span className="font-semibold">{currencySymbol}{Number(invoice.grandTotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-red-600 font-medium">
            <span>(+) Previous Due (পূর্বের বাকি):</span>
            <span>+{currencySymbol}{Number(invoice.previousDue || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-sm pt-2 border-t border-neutral-200 dark:border-neutral-700">
            <span>(=) Net Total Payable (সর্বমোট দেয়):</span>
            <span>
              {currencySymbol}
              {(Number(invoice.grandTotal) + Number(invoice.previousDue || 0)).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-emerald-600 font-bold">
            <span>(-) Paid Today (পরিশোধ):</span>
            <span>-{currencySymbol}{Number(invoice.paidAmount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-amber-600 font-extrabold text-sm pt-1 border-t border-dashed border-neutral-300 dark:border-neutral-700">
            <span>(=) Closing Due (বর্তমান বাকি):</span>
            <span>{currencySymbol}{Number(invoice.dueAmount).toFixed(2)}</span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <button
            type="button"
            onClick={() => onPrint(invoice)}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-xs"
          >
            <Printer size={15} /> Print Invoice
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}