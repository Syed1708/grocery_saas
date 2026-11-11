"use client";

import React from "react";
import { X, ClipboardList, CheckCircle2, Clock } from "lucide-react";
import { IPurchaseOrder } from "@/types/purchase-order";

interface Props {
  order: IPurchaseOrder | null;
  onClose: () => void;
  currencySymbol?: string;
}

export default function ViewOrderModal({ order, onClose, currencySymbol = "৳" }: Props) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardList className="text-blue-600" size={18} />
              <h2 className="text-base font-bold">অর্ডার বিস্তারিত: #{order.orderNo}</h2>
              <span
                className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase inline-flex items-center gap-1 ${
                  order.status === "CONVERTED"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400"
                }`}
              >
                {order.status === "CONVERTED" ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                {order.status === "CONVERTED" ? "চালানে রূপান্তরিত" : "ড্রাফট অর্ডার"}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              সরবরাহকারী: <b>{order.supplierCompany || order.supplierName}</b> ({order.supplierPhone || "No phone"})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-xl"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <table className="w-full text-left text-xs border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
            <thead className="bg-neutral-50 dark:bg-neutral-800/60 border-b font-semibold text-neutral-600 dark:text-neutral-300">
              <tr>
                <th className="py-2.5 px-3">পণ্য</th>
                <th className="py-2.5 px-3 text-center">পরিমাণ</th>
                <th className="py-2.5 px-3 text-right">একক দর</th>
                <th className="py-2.5 px-3 text-right">মোট</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-mono">
              {order.items.map((i, idx) => (
                <tr key={idx}>
                  <td className="py-2 px-3 font-sans font-medium text-neutral-800 dark:text-neutral-200">
                    {i.productName}
                  </td>
                  <td className="py-2 px-3 text-center">{i.quantity} {i.unitCode}</td>
                  <td className="py-2 px-3 text-right">{currencySymbol}{i.unitCost.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right font-bold">{currencySymbol}{i.lineTotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl flex justify-between items-center text-xs font-mono">
            <span>মোট আইটেম: <b>{order.items.length} টি</b></span>
            <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              আনুমানিক মূল্য: {currencySymbol}{order.estimatedTotal.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-semibold"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
}