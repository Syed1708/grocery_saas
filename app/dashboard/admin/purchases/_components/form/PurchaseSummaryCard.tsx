"use client";

import { Loader2, CheckCircle2 } from "lucide-react";

interface Props {
  totalQuantity: number;
  subtotal: number;
  discount: number;
  onDiscountChange: (v: number) => void;
  transportCost: number;
  onTransportCostChange: (v: number) => void;
  vatPercent: number;
  onVatPercentChange: (v: number) => void;
  grandTotal: number;
  supplierPreviousDue: number;
  netTotalPayable: number;
  paidAmount: number;
  onPaidAmountChange: (v: number) => void;
  chalanDue: number;
  finalSupplierBalance: number;
  paymentMethod: string;
  onPaymentMethodChange: (m: string) => void;
  notes: string;
  onNotesChange: (n: string) => void;
  loading: boolean;
  disabledSubmit: boolean;
  currencySymbol?: string;
  mode?: "create" | "edit";
}

export default function PurchaseSummaryCard({
  totalQuantity,
  subtotal,
  discount,
  onDiscountChange,
  transportCost,
  onTransportCostChange,
  vatPercent,
  onVatPercentChange,
  grandTotal,
  supplierPreviousDue,
  netTotalPayable,
  paidAmount,
  onPaidAmountChange,
  chalanDue,
  finalSupplierBalance,
  paymentMethod,
  onPaymentMethodChange,
  notes,
  onNotesChange,
  loading,
  disabledSubmit,
  currencySymbol = "৳",
  mode = "create",
}: Props) {
  const vatAmount = Math.round((Math.max(0, subtotal - discount) * vatPercent) / 100 * 100) / 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      {/* Payment Method & Notes */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            পেমেন্ট মাধ্যম (Payment Method)
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => onPaymentMethodChange(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="cash">ক্যাশ ড্রয়ার (Cash Drawer)</option>
            <option value="bank">ব্যাংক একাউন্ট (Bank Account)</option>
            <option value="bkash">বিকাশ মার্চেন্ট (bKash)</option>
            <option value="nagad">নগদ (Nagad)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            চালানের বিশেষ মন্তব্য বা রেফারেন্স
          </label>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="গাড়ি নম্বর, ডেলিভারি ম্যান বা চালান সংক্রান্ত মন্তব্য..."
            className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Calculations Summary */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs space-y-3 text-xs">
        <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
          <span>মোট পরিমাণ:</span>
          <strong className="text-neutral-900 dark:text-neutral-100 font-mono">{totalQuantity.toFixed(2)}</strong>
        </div>

        <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
          <span>সাবটোটাল:</span>
          <strong className="text-neutral-900 dark:text-neutral-100 font-mono">{currencySymbol}{subtotal.toFixed(2)}</strong>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-neutral-600 dark:text-neutral-400">বিশেষ ছাড় (-):</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={discount}
            onChange={(e) => onDiscountChange(Number(e.target.value))}
            className="w-28 px-2.5 py-1 text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none text-right font-bold bg-white dark:bg-neutral-800"
          />
        </div>

        <div className="flex justify-between items-center">
          <span className="text-neutral-600 dark:text-neutral-400">পরিবহন ও কুলি খরচ (+):</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={transportCost}
            onChange={(e) => onTransportCostChange(Number(e.target.value))}
            className="w-28 px-2.5 py-1 text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none text-right font-bold bg-white dark:bg-neutral-800"
          />
        </div>

        <div className="flex justify-between items-center">
          <span className="text-neutral-600 dark:text-neutral-400">ভ্যাট হার (%):</span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              step="0.1"
              min="0"
              value={vatPercent}
              onChange={(e) => onVatPercentChange(Number(e.target.value))}
              className="w-16 px-2 py-1 text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none text-right font-bold bg-white dark:bg-neutral-800"
            />
            <span className="text-[11px] text-neutral-400">({currencySymbol}{vatAmount.toFixed(2)})</span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-neutral-200 dark:border-neutral-800 text-sm font-bold text-neutral-900 dark:text-neutral-100">
          <span>চালান মূল্য (Bill Total):</span>
          <span className="text-blue-600 dark:text-blue-400 font-mono">{currencySymbol}{grandTotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center p-2 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 font-semibold">
          <span>সাপ্লায়ারের পূর্বের বকেয়া:</span>
          <span className="font-mono">{currencySymbol}{supplierPreviousDue.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center pt-2 border-t-2 border-neutral-200 dark:border-neutral-800 text-base font-extrabold text-neutral-900 dark:text-neutral-100">
          <span>সর্বমোট প্রদেয় (Net Payable):</span>
          <span className="font-mono">{currencySymbol}{netTotalPayable.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center pt-1">
          <span className="font-bold text-neutral-800 dark:text-neutral-200">আজকের পরিশোধ (Paid):</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={paidAmount}
            onChange={(e) => onPaidAmountChange(Number(e.target.value))}
            className="w-32 px-2.5 py-1 text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none text-right font-extrabold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-neutral-800"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
            <span className="text-[10px] block">চালানের বাকি:</span>
            <strong className="font-mono text-xs">{currencySymbol}{chalanDue.toFixed(2)}</strong>
          </div>
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400">
            <span className="text-[10px] block">সর্বমোট অবশিষ্ট বাকি:</span>
            <strong className="font-mono text-xs">{currencySymbol}{finalSupplierBalance.toFixed(2)}</strong>
          </div>
        </div>

        <div className="pt-3">
          <button
            type="submit"
            disabled={loading || disabledSubmit}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            {mode === "edit" ? "চালান আপডেট করুন" : "চালান ইনওয়ার্ড ও স্টক সম্পন্ন করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}