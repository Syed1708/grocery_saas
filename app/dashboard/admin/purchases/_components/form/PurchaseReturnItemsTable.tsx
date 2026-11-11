"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { ReturnRow } from "./usePurchaseReturnForm";
import { ReturnReason } from "@/types/purchase-return";

interface Props {
  items: ReturnRow[];
  products: any[];
  onUpdateRow: (rowId: string, patch: Partial<ReturnRow>) => void;
  onRemoveRow: (rowId: string) => void;
  currencySymbol?: string;
  sanitizeNumber: (val: any) => number;
}

export default function PurchaseReturnItemsTable({
  items,
  products,
  onUpdateRow,
  onRemoveRow,
  currencySymbol = "৳",
  sanitizeNumber,
}: Props) {
  if (items.length === 0) {
    return (
      <div className="border border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl p-8 text-center text-xs text-neutral-400 bg-neutral-50/50 dark:bg-neutral-900/50">
        কোন ফেরত পণ্য নির্বাচন করা হয়নি। বারকোড স্ক্যান করুন অথবা উপরের বোতাম থেকে পণ্য যুক্ত করুন।
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 shadow-xs">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 font-semibold">
            <th className="py-3 px-4 min-w-50">ফেরতযোগ্য পণ্য</th>
            <th className="py-3 px-3 text-center min-w-32.5">ফেরতের কারণ</th>
            <th className="py-3 px-3 text-center w-28">বর্তমান স্টক</th>
            <th className="py-3 px-3 text-center w-28">ফেরত পরিমাণ</th>
            <th className="py-3 px-3 text-right w-32">ক্রয়দর ({currencySymbol})</th>
            <th className="py-3 px-4 text-right w-36">মোট মূল্য</th>
            <th className="py-3 px-3 text-center w-12">#</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {items.map((row) => (
            <tr key={row.rowId} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
              <td className="py-2.5 px-4">
                <select
                  value={row.productId}
                  onChange={(e) => onUpdateRow(row.rowId, { productId: e.target.value })}
                  className="w-full p-2 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-xs font-medium"
                >
                  <option value="">পণ্য নির্বাচন করুন...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.barcode ? `(${p.barcode})` : ""}
                    </option>
                  ))}
                </select>
              </td>

              <td className="py-2.5 px-3">
                <select
                  value={row.reason}
                  onChange={(e) =>
                    onUpdateRow(row.rowId, { reason: e.target.value as ReturnReason })
                  }
                  className="w-full p-2 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-[11px]"
                >
                  <option value="DAMAGED">ভেঙে গেছে / ক্ষতিগ্রস্ত</option>
                  <option value="EXPIRED">মেয়াদ উত্তীর্ণ</option>
                  <option value="WRONG_ITEM">ভুল পণ্য এসেছে</option>
                  <option value="POOR_QUALITY">মানসম্মত নয়</option>
                  <option value="OTHER">অন্যান্য</option>
                </select>
              </td>

              <td className="py-2.5 px-3 text-center font-mono font-semibold text-neutral-500">
                {row.availableStock}
              </td>

              <td className="py-2.5 px-3">
                <input
                  type="number"
                  min="1"
                  max={row.availableStock || 99999}
                  value={row.quantity}
                  onChange={(e) =>
                    onUpdateRow(row.rowId, { quantity: sanitizeNumber(e.target.value) })
                  }
                  className="w-full p-2 text-center font-mono font-bold border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-xs"
                />
              </td>

              <td className="py-2.5 px-3">
                <input
                  type="number"
                  step="0.01"
                  value={row.unitCost}
                  onChange={(e) =>
                    onUpdateRow(row.rowId, { unitCost: sanitizeNumber(e.target.value) })
                  }
                  className="w-full p-2 text-right font-mono border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-xs"
                />
              </td>

              <td className="py-2.5 px-4 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100">
                {currencySymbol}{row.lineTotal.toFixed(2)}
              </td>

              <td className="py-2.5 px-3 text-center">
                <button
                  type="button"
                  onClick={() => onRemoveRow(row.rowId)}
                  className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg transition"
                >
                  <Trash2 size={15} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}