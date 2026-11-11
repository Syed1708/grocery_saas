"use client";

import React from "react";
import { ArrowDownLeft, Banknote, Save } from "lucide-react";
import { ReturnSettlementType } from "@/types/purchase-return";

interface Props {
  totalQuantity: number;
  totalAmount: number;
  supplierPreviousDue: number;
  settlementType: ReturnSettlementType;
  onSettlementTypeChange: (val: ReturnSettlementType) => void;
  refundAmount: number;
  onRefundAmountChange: (val: number) => void;
  paymentMethod: string;
  onPaymentMethodChange: (val: string) => void;
  dueDeduction: number;
  finalSupplierDue: number;
  notes: string;
  onNotesChange: (val: string) => void;
  loading: boolean;
  disabledSubmit: boolean;
  currencySymbol?: string;
}

export default function PurchaseReturnSummaryCard({
  totalQuantity,
  totalAmount,
  supplierPreviousDue,
  settlementType,
  onSettlementTypeChange,
  refundAmount,
  onRefundAmountChange,
  paymentMethod,
  onPaymentMethodChange,
  dueDeduction,
  finalSupplierDue,
  notes,
  onNotesChange,
  loading,
  disabledSubmit,
  currencySymbol = "৳",
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
            সমন্বয়ের ধরণ (Settlement Type)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onSettlementTypeChange("DUE_DEDUCTION")}
              className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 ${
                settlementType === "DUE_DEDUCTION"
                  ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 font-bold"
                  : "border-neutral-200 dark:border-neutral-700"
              }`}
            >
              <ArrowDownLeft size={16} />
              <div className="text-xs">
                <div>বাকির খাতা সমন্বয়</div>
                <div className="text-[10px] text-neutral-500 font-normal">দেনার পরিমাণ কমবে</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onSettlementTypeChange("CASH_REFUND")}
              className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 ${
                settlementType === "CASH_REFUND"
                  ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 font-bold"
                  : "border-neutral-200 dark:border-neutral-700"
              }`}
            >
              <Banknote size={16} />
              <div className="text-xs">
                <div>নগদ রিফান্ড গ্রহণ</div>
                <div className="text-[10px] text-neutral-500 font-normal">ক্যাশ ড্রয়ারে টাকা ঢুকবে</div>
              </div>
            </button>
          </div>
        </div>

        {settlementType === "CASH_REFUND" && (
          <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <div>
              <label className="block text-xs font-medium mb-1">প্রাপ্ত নগদ অর্থ</label>
              <input
                type="number"
                value={refundAmount || ""}
                onChange={(e) => onRefundAmountChange(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full p-2 text-xs font-mono font-bold border rounded-lg bg-white dark:bg-neutral-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">পদ্ধতি</label>
              <select
                value={paymentMethod}
                onChange={(e) => onPaymentMethodChange(e.target.value)}
                className="w-full p-2 text-xs border rounded-lg bg-white dark:bg-neutral-800"
              >
                <option value="cash">নগদ (Cash Drawer)</option>
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
                <option value="bank">ব্যাংক ট্রান্সফার</option>
              </select>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium mb-1 text-neutral-700 dark:text-neutral-300">
            মন্তব্য (Notes)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="ফেরতের অতিরিক্ত তথ্য লিখুন..."
            className="w-full p-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800"
          />
        </div>
      </div>

      <div className="bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 flex flex-col justify-between space-y-4">
        <div className="space-y-2 text-xs font-mono">
          <div className="flex justify-between text-neutral-500">
            <span>মোট ফেরত আইটেম:</span>
            <span>{totalQuantity} টি</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-neutral-900 dark:text-neutral-100 border-b pb-2">
            <span>মোট ফেরত মূল্য:</span>
            <span>{currencySymbol}{totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
            <span>সাপ্লায়ার পূর্বের বাকি:</span>
            <span>{currencySymbol}{supplierPreviousDue.toFixed(2)}</span>
          </div>
          {dueDeduction > 0 && (
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>বাকি সমন্বয় (-):</span>
              <span>- {currencySymbol}{dueDeduction.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs font-bold pt-2 border-t text-neutral-800 dark:text-neutral-200">
            <span>চূড়ান্ত বাকি স্থিতি:</span>
            <span className="text-blue-600">{currencySymbol}{finalSupplierDue.toFixed(2)}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || disabledSubmit}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-300 dark:disabled:bg-neutral-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Save size={16} />
          {loading ? "প্রসেসিং হচ্ছে..." : "পণ্য ফেরত নিশ্চিত করুন (Save Return)"}
        </button>
      </div>
    </div>
  );
}