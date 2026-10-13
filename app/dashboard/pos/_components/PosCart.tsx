"use client";

import { Trash2, Plus, Minus, Zap } from "lucide-react";
import { PosCartItem } from "./usePosCart";

interface PosCartProps {
  cart: PosCartItem[];
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
  return (
    <div className="w-97.5 sm:w-110 bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 flex flex-col justify-between shrink-0 shadow-lg select-none">
      {/* 1. Cart Header Bar */}
      <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-base">🛒</span>
          <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
            Your Cart Items (আপনার কার্ট)
          </h3>
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
            {cart.length} Items
          </span>
        </div>
        {cart.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-[11px] font-semibold text-red-600 hover:underline cursor-pointer"
          >
            🗑️ Clear All
          </button>
        )}
      </div>

      {/* 2. Scrollable Items Table */}
      <div className="flex-1 overflow-y-auto">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-neutral-400 space-y-1">
            <span className="text-4xl opacity-40">🛍️</span>
            <strong className="text-sm font-bold text-neutral-800 dark:text-neutral-200 block pt-1">
              কার্ট বর্তমানে খালি
            </strong>
            <span className="text-xs">বারকোড স্ক্যান করুন অথবা বামের পণ্যে ক্লিক করুন।</span>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-100 dark:border-neutral-800 text-neutral-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-2 text-left">পণ্য (Item)</th>
                <th className="p-2 text-center w-24">পরিমাণ (Qty)</th>
                <th className="p-2 text-right w-20">মোট (Total)</th>
                <th className="p-2 w-7"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {cart.map((item) => (
                <tr key={item.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40">
                  <td className="p-2">
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100 block truncate max-w-37.5">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {currencySymbol}{item.unitPrice.toFixed(2)} / {item.unitCode}
                    </span>
                  </td>
                  <td className="p-2 text-center">
                    <div className="inline-flex items-center gap-1 border border-neutral-200 dark:border-neutral-700 rounded-lg p-0.5 bg-neutral-50 dark:bg-neutral-800">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                        className="w-5 h-5 flex items-center justify-center rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 cursor-pointer"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="w-6 text-center font-bold text-xs">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                        className="w-5 h-5 flex items-center justify-center rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 cursor-pointer"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                  </td>
                  <td className="p-2 text-right font-black font-mono">
                    {currencySymbol}{item.lineTotal.toFixed(2)}
                  </td>
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => onRemove(item.id)}
                      className="text-neutral-400 hover:text-red-600 transition cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 3. Payment & Totals Summary Footer */}
      <div className="p-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 space-y-2.5">
        {/* Totals Row */}
        <div className="grid grid-cols-3 gap-2 items-center pb-2 border-b border-dashed border-neutral-200 dark:border-neutral-700 text-xs">
          <div className="text-[11.5px] text-neutral-500">
            Subtotal: <strong className="text-neutral-900 dark:text-neutral-100 font-mono">{currencySymbol}{subtotal.toFixed(2)}</strong>
            {enableVat && (
              <span className="block text-[10px]">
                VAT ({vatPercent}%): <strong className="font-mono">{currencySymbol}{vatAmount.toFixed(2)}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center justify-end gap-1.5 text-xs">
            <span className="text-[11px] text-neutral-500">ছাড় (Disc):</span>
            <input
              type="number"
              step="0.5"
              min="0"
              value={discount || ""}
              onChange={(e) => onDiscountChange(Number(e.target.value))}
              placeholder="0.00"
              className="w-16 px-1.5 py-0.5 text-right text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md outline-none font-bold"
            />
          </div>

          <div className="text-right">
            <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block">সর্বমোট প্রদেয়</span>
            <span className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">
              {currencySymbol}{grandTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Quick Cash Buttons */}
        <div className="flex gap-1 items-center">
          {[50, 100, 500, 1000].map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => onSetQuickCash(amt)}
              className="flex-1 py-1 text-[11px] font-bold rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition cursor-pointer"
            >
              {currencySymbol}{amt}
            </button>
          ))}
          <button
            type="button"
            onClick={onSetExactCash}
            className="flex-1 py-1 text-[11px] font-bold rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
          >
            Exact
          </button>
          <button
            type="button"
            onClick={onToggleSplitPay}
            className="px-2 py-1 text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-0.5 cursor-pointer shrink-0"
          >
            <Zap size={11} /> Split Pay
          </button>
        </div>

        {/* Split Payment Panel (Collapsible) */}
        {showSplitPay && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-2 space-y-1 animate-in fade-in duration-200">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-neutral-400 block">নগদ (Cash)</label>
                <input
                  type="number"
                  min="0"
                  value={cashPaid || ""}
                  onChange={(e) => onCashPaidChange(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-2 py-1 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] block text-fuchsia-600 font-bold">bKash/Nagad</label>
                <input
                  type="number"
                  min="0"
                  value={bkashPaid || ""}
                  onChange={(e) => onBkashPaidChange(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-2 py-1 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none font-bold text-fuchsia-600"
                />
              </div>
              <div>
                <label className="text-[10px] block text-indigo-600 font-bold">Bank / Card</label>
                <input
                  type="number"
                  min="0"
                  value={bankPaid || ""}
                  onChange={(e) => onBankPaidChange(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-2 py-1 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none font-bold text-indigo-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* Paid / Due / Change Inputs */}
        <div className="grid grid-cols-3 gap-2 items-center text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[11px] shrink-0">পরিশোধ:</span>
            <input
              type="number"
              step="0.5"
              min="0"
              value={cashPaid || ""}
              onChange={(e) => onCashPaidChange(Number(e.target.value))}
              placeholder="0.00"
              className="w-full px-2 py-1 text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none font-black text-emerald-600 font-mono"
            />
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/60 p-1.5 rounded-lg text-right">
            <span className="text-[9px] text-neutral-400 block">ফেরত (Change):</span>
            <strong className="text-emerald-600 font-mono text-xs block truncate">
              {currencySymbol}{changeAmount.toFixed(2)}
            </strong>
          </div>

          <div className="bg-red-50 dark:bg-red-950/60 p-1.5 rounded-lg text-right">
            <span className="text-[9px] text-red-500 block">বাকি (Due):</span>
            <strong className="text-red-600 font-mono text-xs block truncate">
              {currencySymbol}{dueAmount.toFixed(2)}
            </strong>
          </div>
        </div>

        {/* Complete Sale Button */}
        <button
          type="button"
          onClick={onSubmitSale}
          disabled={loading || cart.length === 0}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-xl transition shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
        >
          ✓ Complete Sale &amp; Print Slip [F2]
        </button>
      </div>
    </div>
  );
}