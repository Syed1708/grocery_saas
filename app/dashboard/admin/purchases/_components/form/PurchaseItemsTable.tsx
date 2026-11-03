"use client";

import { Trash2 } from "lucide-react";
import { PurchaseRow } from "./usePurchaseForm";

interface Props {
  items: PurchaseRow[];
  products: any[];
  onUpdateRow: (rowId: string, field: keyof PurchaseRow, value: any) => void;
  onRemoveRow: (rowId: string) => void;
  highlightedRowId: string | null;
  currencySymbol?: string;
  sanitizeNumber: (v: any) => number;
}

export default function PurchaseItemsTable({
  items,
  products,
  onUpdateRow,
  onRemoveRow,
  highlightedRowId,
  currencySymbol = "৳",
  sanitizeNumber,
}: Props) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
      <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
        <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">চালানের পণ্যের তালিকা</h3>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          {items.filter((i) => i.productId).length} টি পণ্য
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="p-3.5 min-w-70">পণ্য নির্বাচন</th>
              <th className="p-3.5 text-center w-28">বর্তমান স্টক</th>
              <th className="p-3.5 w-32">পরিমাণ</th>
              <th className="p-3.5 w-32">একক দর ({currencySymbol})</th>
              <th className="p-3.5 w-32">কমিশন/ছাড় ({currencySymbol})</th>
              <th className="p-3.5 text-right w-36">মোট মূল্য</th>
              <th className="p-3.5 text-center w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {items.map((row) => {
              const lineTotal = row.productId
                ? Math.max(0, row.quantity * row.unitCost - (row.commission || 0))
                : 0;
              const isHighlighted = highlightedRowId === row.rowId;

              return (
                <tr
                  key={row.rowId}
                  className={`transition-colors ${
                    isHighlighted ? "bg-emerald-50 dark:bg-emerald-950/40" : "hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40"
                  }`}
                >
                  <td className="p-3">
                    <select
                      value={row.productId}
                      onChange={(e) => onUpdateRow(row.rowId, "productId", e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none cursor-pointer"
                    >
                      <option value="">-- ড্রপডাউন থেকে পণ্য সিলেক্ট করুন --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.barcode})
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="p-3 text-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                      {row.stock} {row.unit}
                    </span>
                  </td>

                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={row.quantity}
                        onChange={(e) => onUpdateRow(row.rowId, "quantity", sanitizeNumber(e.target.value))}
                        className="w-20 px-2 py-1 text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none bg-white dark:bg-neutral-800 text-center font-bold"
                      />
                      <span className="text-[11px] text-neutral-400">{row.unit}</span>
                    </div>
                  </td>

                  <td className="p-3">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={row.unitCost}
                      onChange={(e) => onUpdateRow(row.rowId, "unitCost", sanitizeNumber(e.target.value))}
                      className="w-24 px-2 py-1 text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none bg-white dark:bg-neutral-800 text-center font-bold"
                    />
                  </td>

                  <td className="p-3">
                    <input
                      type="number"
                      step="0.01"
                      value={row.commission}
                      onChange={(e) => onUpdateRow(row.rowId, "commission", sanitizeNumber(e.target.value))}
                      className="w-20 px-2 py-1 text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none bg-white dark:bg-neutral-800 text-center"
                    />
                  </td>

                  <td className="p-3 text-right font-bold text-xs font-mono">
                    {currencySymbol}{lineTotal.toFixed(2)}
                  </td>

                  <td className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => onRemoveRow(row.rowId)}
                      className="p-1 rounded text-neutral-400 hover:text-red-600 transition cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}