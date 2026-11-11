"use client";

import React from "react";
import { X, AlertOctagon } from "lucide-react";
import { IStockWastage } from "@/types/stock-wastage";

interface Props {
  wastage: IStockWastage;
  onClose: () => void;
  currencySymbol?: string;
}

export default function ViewWastageModal({
  wastage,
  onClose,
  currencySymbol = "৳",
}: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        <div className="p-5 border-b flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <AlertOctagon className="text-red-500" size={18} />
              <h2 className="text-base font-bold">ভাউচার বিস্তারিত: #{wastage.wastageNo}</h2>
            </div>
            <p className="text-xs text-neutral-400">
              তারিখ: {new Date(wastage.date).toLocaleDateString()} | ব্রাঞ্চ: {wastage.branchName}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-neutral-400 rounded-xl">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <table className="w-full text-left text-xs border rounded-xl overflow-hidden">
            <thead className="bg-neutral-50 dark:bg-neutral-800/60 border-b font-semibold">
              <tr>
                <th className="py-2.5 px-3">পণ্য</th>
                <th className="py-2.5 px-3 text-center">পরিমাণ</th>
                <th className="py-2.5 px-3 text-right">ক্রয়মূল্য</th>
                <th className="py-2.5 px-3 text-right">মোট ক্ষতি</th>
              </tr>
            </thead>
            <tbody className="divide-y font-mono">
              {wastage.items.map((i, idx) => (
                <tr key={idx}>
                  <td className="py-2 px-3 font-sans font-medium">{i.productName}</td>
                  <td className="py-2 px-3 text-center">{i.quantity} {i.unitCode}</td>
                  <td className="py-2 px-3 text-right">{currencySymbol}{i.unitCost.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right font-bold text-red-600">
                    {currencySymbol}{i.lineCost.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {wastage.notes && (
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl text-xs">
              <span className="font-bold block text-neutral-600 mb-0.5">মন্তব্য:</span>
              <p className="text-neutral-500 italic">{wastage.notes}</p>
            </div>
          )}

          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl flex justify-between items-center text-xs font-mono">
            <span className="font-bold text-red-800 dark:text-red-300">মোট আর্থিক ক্ষতি (P&L):</span>
            <span className="text-base font-extrabold text-red-600">
              {currencySymbol}{wastage.totalCost.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-xs font-semibold"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
}