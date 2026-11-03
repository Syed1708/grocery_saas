"use client";

import { Trash2, Plus, Minus, Zap } from "lucide-react";
import { ISaleCartItem } from "@/types/sale";

interface PosCartProps {
  cart: ISaleCartItem[];
  onUpdateQty: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
  onClear: () => void;
  subtotal: number;
  vatPercent: number;
  vatAmount: number;
  discount: number;
  onDiscountChange: (d: number) => void;
  grandTotal: number;
  showSplitPay: boolean;
  onToggleSplitPay: () => void;
  cashPaid: number;
  onCashPaidChange: (v: number) => void;
  bkashPaid: number;
  onBkashPaidChange: (v: number) => void;
  bankPaid: number;
  onBankPaidChange: (v: number) => void;
  changeAmount: number;
  dueAmount: number;
  onSetQuickCash: (amount: number) => void;
  onSetExactCash: () => void;
  onSubmitSale: () => void;
  loading: boolean;
  enableVat?: boolean;
  currencySymbol?: string;
}

export default function PosCart({
  cart,
  onUpdateQty,
  onRemove,
  onClear,
  subtotal,
  vatPercent,
  vatAmount,
  discount,
  onDiscountChange,
  grandTotal,
  showSplitPay,
  onToggleSplitPay,
  cashPaid,
  onCashPaidChange,
  bkashPaid,
  onBkashPaidChange,
  bankPaid,
  onBankPaidChange,
  changeAmount,
  dueAmount,
  onSetQuickCash,
  onSetExactCash,
  onSubmitSale,
  loading,
  enableVat = false,
  currencySymbol = "৳",
}: PosCartProps) {
  const sanitize = (val: string) => Math.max(0, Number(val) || 0);

  return (
    <div className="w-97.5 sm:w-110 bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 flex flex-col justify-between shrink-0 shadow-lg select-none">
      <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-base">🛒</span>
          <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">কার্ট তালিকা</h3>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">{cart.length} টি পণ্য</span>
        </div>
        {cart.length > 0 && (
          <button type="button" onClick={onClear} className="text-[11px] font-semibold text-red-600 hover:underline cursor-pointer">
            🗑️ সব মুছুন
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-neutral-400 space-y-1">
            <span className="text-4xl opacity-40">🛍️</span>
            <strong className="text-sm font-bold block pt-1 text-neutral-800 dark:text-neutral-200">কার্ট খালি</strong>
            <span className="text-xs">বারকোড স্ক্যান করুন অথবা পণ্যে ক্লিক করুন।</span>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-100 dark:border-neutral-800 text-neutral-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-2 text-left">পণ্য</th>
                <th className="p-2 text-center w-24">পরিমাণ</th>
                <th className="p-2 text-right w-20">মোট</th>
                <th className="p-2 w-7"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {cart.map((item) => (
                <tr key={item.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40">
                  <td className="p-2">
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100 block truncate max-w-37.5">{item.name}</span>
                    <span className="text-[10px] text-neutral-400 font-mono">{currencySymbol}{item.unitPrice.toFixed(2)} / {item.unitCode}</span>
                  </td>
                  <td className="p-2 text-center">
                    <div className="inline-flex items-center gap-1 border border-neutral-200 dark:border-neutral-700 rounded-lg p-0.5 bg-neutral-50 dark:bg-neutral-800">
                      <button type="button" onClick={() => onUpdateQty(item.id, item.quantity - 1)} className="w-5 h-5 flex items-center justify-center rounded hover:bg-neutral-200 text-neutral-600 cursor-pointer">
                        <Minus size={11} />
                      </button>
                      <span className="w-6 text-center font-bold text-xs">{item.quantity}</span>
                      <button type="button" onClick={() => onUpdateQty(item.id, item.quantity + 1)} className="w-5 h-5 flex items-center justify-center rounded hover:bg-neutral-200 text-neutral-600 cursor-pointer">
                        <Plus size={11} />
                      </button>
                    </div>
                  </td>
                  <td className="p-2 text-right font-black font-mono">{currencySymbol}{item.lineTotal.toFixed(2)}</td>
                  <td className="p-2 text-center">
                    <button type="button" onClick={() => onRemove(item.id)} className="text-neutral-400 hover:text-red-600 cursor-pointer">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="p-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 space-y-2.5">
        <div className="grid grid-cols-3 gap-2 items-center pb-2 border-b border-dashed border-neutral-200 dark:border-neutral-700 text-xs">
          <div className="text-[11.5px] text-neutral-500">
            সাবটোটাল: <strong className="text-neutral-900 dark:text-neutral-100 font-mono">{currencySymbol}{subtotal.toFixed(2)}</strong>
            {enableVat && <span className="block text-[10px]">ভ্যাট ({vatPercent}%): <strong className="font-mono">{currencySymbol}{vatAmount.toFixed(2)}</strong></span>}
          </div>

          <div className="flex items-center justify-end gap-1.5 text-xs">
            <span className="text-[11px] text-neutral-500">ছাড়:</span>
            <input
              type="number"
              min="0"
              value={discount || ""}
              onChange={(e) => onDiscountChange(sanitize(e.target.value))}
              placeholder="0.00"
              className="w-16 px-1.5 py-0.5 text-right text-xs bg-white dark:bg-neutral-800 border rounded-md font-bold"
            />
          </div>

          <div className="text-right">
            <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block">সর্বমোট বিল</span>
            <span className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">{currencySymbol}{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex gap-1 items-center">
          {[50, 100, 500, 1000].map((amt) => (
            <button key={amt} type="button" onClick={() => onSetQuickCash(amt)} className="flex-1 py-1 text-[11px] font-bold rounded-md bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 cursor-pointer">
              {currencySymbol}{amt}
            </button>
          ))}
          <button type="button" onClick={onSetExactCash} className="flex-1 py-1 text-[11px] font-bold rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 cursor-pointer">
            Exact
          </button>
          <button type="button" onClick={onToggleSplitPay} className="px-2 py-1 text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-0.5 cursor-pointer">
            <Zap size={11} /> Split
          </button>
        </div>

        {showSplitPay && (
          <div className="bg-white dark:bg-neutral-900 border rounded-xl p-2 space-y-1">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-neutral-400 block">নগদ</label>
                <input type="number" min="0" value={cashPaid || ""} onChange={(e) => onCashPaidChange(sanitize(e.target.value))} className="w-full px-2 py-1 text-xs border rounded-lg font-bold" />
              </div>
              <div>
                <label className="text-[10px] text-fuchsia-600 font-bold block">বিকাশ</label>
                <input type="number" min="0" value={bkashPaid || ""} onChange={(e) => onBkashPaidChange(sanitize(e.target.value))} className="w-full px-2 py-1 text-xs border rounded-lg font-bold text-fuchsia-600" />
              </div>
              <div>
                <label className="text-[10px] text-indigo-600 font-bold block">ব্যাংক</label>
                <input type="number" min="0" value={bankPaid || ""} onChange={(e) => onBankPaidChange(sanitize(e.target.value))} className="w-full px-2 py-1 text-xs border rounded-lg font-bold text-indigo-600" />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 items-center text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[11px]">পরিশোধ:</span>
            <input type="number" min="0" value={cashPaid || ""} onChange={(e) => onCashPaidChange(sanitize(e.target.value))} className="w-full px-2 py-1 text-xs border rounded-lg font-black text-emerald-600 font-mono" />
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/60 p-1.5 rounded-lg text-right">
            <span className="text-[9px] text-neutral-400 block">ফেরত:</span>
            <strong className="text-emerald-600 font-mono text-xs">{currencySymbol}{changeAmount.toFixed(2)}</strong>
          </div>
          <div className="bg-red-50 dark:bg-red-950/60 p-1.5 rounded-lg text-right">
            <span className="text-[9px] text-red-500 block">বাকি:</span>
            <strong className="text-red-600 font-mono text-xs">{currencySymbol}{dueAmount.toFixed(2)}</strong>
          </div>
        </div>

        <button
          type="button"
          onClick={onSubmitSale}
          disabled={loading || cart.length === 0}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-xl transition shadow-md disabled:opacity-50 cursor-pointer"
        >
          {loading ? "প্রক্রিয়াকরণ হচ্ছে..." : "✓ বিক্রয় সম্পন্ন ও রসিদ প্রিন্ট [F2]"}
        </button>
      </div>
    </div>
  );
}