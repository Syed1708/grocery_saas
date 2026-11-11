"use client";

import React, { useState } from "react";
import { Trash2, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
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
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleExpand = (rowId: string) => {
    setExpandedRows((prev) => ({ ...prev, [rowId]: !prev[rowId] }));
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
      <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
        <div>
          <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
            চালানের পণ্যের তালিকা
          </h3>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            চালান পরিমাণ লিখুন; নষ্ট বা কম মাল থাকলে নিচে সমন্বয় করুন
          </p>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          {items.filter((i) => i.productId).length} টি পণ্য
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="p-3.5 min-w-64">পণ্য নির্বাচন</th>
              <th className="p-3.5 text-center w-24">বর্তমান স্টক</th>
              <th className="p-3.5 text-center w-28">চালান পরিমাণ</th>
              <th className="p-3.5 text-center w-28">গৃহীত ভালো স্টক</th>
              <th className="p-3.5 w-28 text-right">একক দর ({currencySymbol})</th>
              <th className="p-3.5 w-24 text-right">কমিশন ({currencySymbol})</th>
              <th className="p-3.5 text-right w-32">মোট মূল্য</th>
              <th className="p-3.5 text-center w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {items.map((row) => {
              const lineTotal = row.productId
                ? Math.max(
                    0,
                    row.quantity * row.unitCost - (row.commission || 0)
                  )
                : 0;

              const hasDiscrepancy =
                Number(row.damagedQuantity || 0) > 0 ||
                Number(row.missingQuantity || 0) > 0;
              const isExpanded = expandedRows[row.rowId] || hasDiscrepancy;
              const isHighlighted = highlightedRowId === row.rowId;

              return (
                <React.Fragment key={row.rowId}>
                  <tr
                    className={`transition-colors ${
                      isHighlighted
                        ? "bg-emerald-50 dark:bg-emerald-950/40"
                        : hasDiscrepancy
                        ? "bg-amber-50/40 dark:bg-amber-950/20"
                        : "hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40"
                    }`}
                  >
                    <td className="p-3">
                      <select
                        value={row.productId}
                        onChange={(e) =>
                          onUpdateRow(row.rowId, "productId", e.target.value)
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none cursor-pointer"
                      >
                        <option value="">-- ড্রপডাউন থেকে পণ্য সিলেক্ট করুন --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.barcode})
                          </option>
                        ))}
                      </select>

                      {/* Discrepancy drawer toggle button */}
                      {row.productId && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(row.rowId)}
                          className="mt-1 text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <AlertTriangle size={11} />
                          {hasDiscrepancy
                            ? `বাদ দেওয়া হয়েছে: ${
                                Number(row.damagedQuantity || 0) +
                                Number(row.missingQuantity || 0)
                              } টি`
                            : "মাল নষ্ট বা শর্ট আছে?"}
                          {isExpanded ? (
                            <ChevronUp size={11} />
                          ) : (
                            <ChevronDown size={11} />
                          )}
                        </button>
                      )}
                    </td>

                    {/* Current shelf stock */}
                    <td className="p-3 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                        {row.stock} {row.unit}
                      </span>
                    </td>

                    {/* Billed Quantity (written on paper memo) */}
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          value={row.billedQuantity || ""}
                          onChange={(e) =>
                            onUpdateRow(
                              row.rowId,
                              "billedQuantity",
                              sanitizeNumber(e.target.value)
                            )
                          }
                          className="w-20 px-2 py-1 text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none bg-white dark:bg-neutral-800 text-center font-bold"
                        />
                        <span className="text-[10px] text-neutral-400">
                          {row.unit}
                        </span>
                      </div>
                    </td>

                    {/* Net Good Stock Received (Computed) */}
                    <td className="p-3 text-center">
                      <span
                        className={`font-mono font-bold text-xs px-2.5 py-1 rounded-lg ${
                          hasDiscrepancy
                            ? "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-300"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                        }`}
                      >
                        {row.quantity} {row.unit}
                      </span>
                    </td>

                    {/* Unit Cost */}
                    <td className="p-3">
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={row.unitCost || ""}
                        onChange={(e) =>
                          onUpdateRow(
                            row.rowId,
                            "unitCost",
                            sanitizeNumber(e.target.value)
                          )
                        }
                        className="w-full px-2 py-1 text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none bg-white dark:bg-neutral-800 text-right font-bold"
                      />
                    </td>

                    {/* Commission */}
                    <td className="p-3">
                      <input
                        type="number"
                        step="0.01"
                        value={row.commission || ""}
                        onChange={(e) =>
                          onUpdateRow(
                            row.rowId,
                            "commission",
                            sanitizeNumber(e.target.value)
                          )
                        }
                        className="w-full px-2 py-1 text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none bg-white dark:bg-neutral-800 text-right"
                      />
                    </td>

                    {/* Line Total */}
                    <td className="p-3 text-right font-bold text-xs font-mono">
                      {currencySymbol}
                      {lineTotal.toFixed(2)}
                    </td>

                    {/* Remove Action */}
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

                  {/* Expandable Discrepancy Drawer */}
                  {isExpanded && (
                    <tr className="bg-amber-50/60 dark:bg-amber-950/30 border-b border-amber-200/50">
                      <td colSpan={8} className="py-2.5 px-4">
                        <div className="flex flex-wrap items-center gap-4 text-xs">
                          <span className="font-semibold text-amber-800 dark:text-amber-300">
                            ডেলিভারিতে গড়মিল এন্ট্রি:
                          </span>

                          <div className="flex items-center gap-1.5">
                            <label className="text-neutral-500">
                              ভাঙা / নষ্ট:
                            </label>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={row.damagedQuantity || ""}
                              onChange={(e) =>
                                onUpdateRow(
                                  row.rowId,
                                  "damagedQuantity",
                                  sanitizeNumber(e.target.value)
                                )
                              }
                              className="w-20 p-1 text-center font-mono border border-amber-300 rounded-lg bg-white dark:bg-neutral-800 text-xs"
                            />
                          </div>

                          <div className="flex items-center gap-1.5">
                            <label className="text-neutral-500">
                              কম এসেছে (শর্ট):
                            </label>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={row.missingQuantity || ""}
                              onChange={(e) =>
                                onUpdateRow(
                                  row.rowId,
                                  "missingQuantity",
                                  sanitizeNumber(e.target.value)
                                )
                              }
                              className="w-20 p-1 text-center font-mono border border-amber-300 rounded-lg bg-white dark:bg-neutral-800 text-xs"
                            />
                          </div>

                          <span className="text-[11px] text-amber-700 dark:text-amber-400 italic">
                            (নষ্ট ও কম মাল স্বয়ংক্রিয়ভাবে স্টক এবং মোট বিল থেকে বাদ যাবে)
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}