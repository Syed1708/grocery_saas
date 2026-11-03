"use client";

import Modal from "@/components/common/Modal";
import { Printer } from "lucide-react";
import { IPurchase } from "@/types/purchase";

interface Props {
  invoice: IPurchase | null;
  onClose: () => void;
  onPrint: (inv: IPurchase, format: "80mm" | "58mm" | "a4") => void; // 👈 Accept format
  currencySymbol?: string;
}

export default function ViewInvoiceModal({
  invoice,
  onClose,
  onPrint,
  currencySymbol = "৳",
}: Props) {
  if (!invoice) return null;

  return (
    <Modal
      isOpen={Boolean(invoice)}
      onClose={onClose}
      title={`ক্রয় চালান: #${invoice.chalanNo}`}
      description={`ডিস্ট্রিবিউটর: ${invoice.supplierCompany || invoice.supplierName} • তারিখ: ${new Date(invoice.purchaseDate).toLocaleDateString()}`}
      maxWidth="md"
    >
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl space-y-1">
          <div className="flex justify-between">
            <span className="text-neutral-500">সরবরাহকারী:</span>
            <strong className="text-neutral-900 dark:text-neutral-100">{invoice.supplierName} ({invoice.supplierCompany})</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">মাল গ্রহণকারী শাখা:</span>
            <span className="font-semibold">{invoice.branchName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">পেমেন্ট মাধ্যম:</span>
            <span className="uppercase font-bold">{invoice.paymentMethod}</span>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-neutral-100 dark:bg-neutral-800 text-[10px] uppercase font-bold text-neutral-500">
              <tr>
                <th className="p-2">পণ্য</th>
                <th className="p-2 text-center">পরিমাণ</th>
                <th className="p-2 text-right">দর</th>
                <th className="p-2 text-right">মোট</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {invoice.items.map((it) => (
                <tr key={it.id}>
                  <td className="p-2 font-medium">{it.productName}</td>
                  <td className="p-2 text-center font-mono">{it.quantity}</td>
                  <td className="p-2 text-right font-mono">{currencySymbol}{it.unitCost.toFixed(2)}</td>
                  <td className="p-2 text-right font-mono font-bold">{currencySymbol}{it.lineTotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div className="p-3 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl space-y-1 font-mono">
          <div className="flex justify-between">
            <span>সাবটোটাল:</span>
            <span>{currencySymbol}{invoice.subtotal.toFixed(2)}</span>
          </div>
          {invoice.discount > 0 && (
            <div className="flex justify-between text-red-500">
              <span>ছাড়:</span>
              <span>-{currencySymbol}{invoice.discount.toFixed(2)}</span>
            </div>
          )}
          {invoice.transportCost > 0 && (
            <div className="flex justify-between">
              <span>পরিবহন খরচ:</span>
              <span>+{currencySymbol}{invoice.transportCost.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm pt-1 border-t border-neutral-200 dark:border-neutral-700">
            <span>চালান মূল্য (Total):</span>
            <span>{currencySymbol}{invoice.grandTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-emerald-600 font-bold">
            <span>পরিশোধিত (Paid):</span>
            <span>{currencySymbol}{invoice.paidAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-rose-600 font-bold">
            <span>চালানের বাকি (Due):</span>
            <span>{currencySymbol}{invoice.dueAmount.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPrint(invoice, "a4")}
              className="px-3.5 py-2 bg-neutral-900 hover:bg-black text-white font-semibold rounded-xl flex items-center gap-1.5 transition text-xs cursor-pointer shadow-xs"
            >
              📄 প্রিন্ট A4 চালান
            </button>
            <button
              type="button"
              onClick={() => onPrint(invoice, "80mm")}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center gap-1.5 transition text-xs cursor-pointer shadow-xs"
            >
              🧾 থার্মাল স্লিপ (80mm)
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-xl font-semibold text-xs hover:bg-neutral-100 cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </Modal>
  );
}