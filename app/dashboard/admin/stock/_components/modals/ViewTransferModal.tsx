"use client";

import React from "react";
import { X, ArrowLeftRight, CheckCircle2, Clock, AlertTriangle, Truck } from "lucide-react";
import { IStockTransfer } from "@/types/stock-transfer";

interface Props {
  transfer: IStockTransfer;
  onClose: () => void;
  currencySymbol?: string;
}

export default function ViewTransferModal({
  transfer,
  onClose,
  currencySymbol = "৳",
}: Props) {
  const hasDamage = transfer.items.some((i) => Number(i.transitDamage || 0) > 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="text-blue-600" size={18} />
              <h2 className="text-base font-bold">চালান বিস্তারিত: #{transfer.transferNo}</h2>
              <span
                className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase inline-flex items-center gap-1 ${
                  transfer.status === "COMPLETED"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                }`}
              >
                {transfer.status === "COMPLETED" ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                {transfer.status === "COMPLETED" ? "গৃহীত (Completed)" : "রাস্তায় আছে (In-Transit)"}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              প্রেরক: <b>{transfer.fromBranchName}</b> ➔ প্রাপক: <b>{transfer.toBranchName}</b>
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-neutral-400 rounded-xl">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Driver & Transport Info */}
          {(transfer.driverName || transfer.vehicleNo) && (
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl text-xs flex items-center gap-3">
              <Truck size={16} className="text-blue-600" />
              <span>
                ড্রাইভার: <b>{transfer.driverName || "N/A"}</b> ({transfer.driverPhone || "No Phone"}) | গাড়ি: <b>{transfer.vehicleNo || "N/A"}</b>
              </span>
            </div>
          )}

          {/* Items Table */}
          <table className="w-full text-left text-xs border rounded-xl overflow-hidden">
            <thead className="bg-neutral-50 dark:bg-neutral-800/60 border-b font-semibold">
              <tr>
                <th className="py-2.5 px-3">পণ্য</th>
                <th className="py-2.5 px-2 text-center">পাঠানো</th>
                <th className="py-2.5 px-2 text-center">গৃহীত</th>
                {hasDamage && <th className="py-2.5 px-2 text-center text-red-600">নষ্ট</th>}
                <th className="py-2.5 px-3 text-right">দর</th>
                <th className="py-2.5 px-3 text-right">মোট</th>
              </tr>
            </thead>
            <tbody className="divide-y font-mono">
              {transfer.items.map((i, idx) => (
                <tr key={idx}>
                  <td className="py-2 px-3 font-sans font-medium">{i.productName}</td>
                  <td className="py-2 px-2 text-center">{i.quantitySent}</td>
                  <td className="py-2 px-2 text-center font-bold text-emerald-600">
                    {i.quantityReceived !== null ? i.quantityReceived : "-"}
                  </td>
                  {hasDamage && (
                    <td className="py-2 px-2 text-center text-red-600 font-bold">
                      {i.transitDamage > 0 ? i.transitDamage : "0"}
                    </td>
                  )}
                  <td className="py-2 px-3 text-right">{currencySymbol}{i.unitCost.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right font-bold">{currencySymbol}{i.lineCost.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {hasDamage && (
            <div className="p-3 border border-dashed border-red-300 bg-red-50/60 dark:bg-red-950/30 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle size={15} />
              <span>
                পরিবহনের সময় ক্ষতিগ্রস্ত পণ্যগুলো প্রাপক ব্রাঞ্চের <b>অপচয় ও ক্ষতিপূরণ (Wastage)</b> লগ-এ অন্তর্ভুক্ত করা হয়েছে।
              </span>
            </div>
          )}
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