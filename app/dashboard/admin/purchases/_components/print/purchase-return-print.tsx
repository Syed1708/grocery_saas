"use client";

import React from "react";
import { IPurchaseReturn } from "@/types/purchase-return";

interface Props {
  data: IPurchaseReturn | null;
  shopName: string;
  currencySymbol?: string;
  format?: "80mm" | "58mm" | "a4";
}

export function PurchaseReturnPrint({
  data,
  shopName,
  currencySymbol = "৳",
  format = "80mm",
}: Props) {
  if (!data) return null;

  const isA4 = format === "a4";

  return (
    <div
      id="printable-return-chalan"
      className="hidden print:block fixed inset-0 bg-white text-black p-4 z-9999 font-sans text-xs"
    >
      <div className={isA4 ? "max-w-3xl mx-auto space-y-4" : "max-w-[80mm] mx-auto space-y-2 text-center"}>
        {/* Store & Document Header */}
        <div className="border-b pb-2">
          <h1 className="text-base font-bold uppercase">{shopName}</h1>
          <p className="font-semibold text-neutral-600">পণ্য ফেরত ভাউচার / ডেবিট নোট (Purchase Return)</p>
          <div className="flex justify-between text-[11px] mt-1 pt-1 border-t border-dashed">
            <span>ভাউচার নং: <b>#{data.returnNo}</b></span>
            <span>তারিখ: {new Date(data.returnDate).toLocaleDateString("bn-BD")}</span>
          </div>
          {data.purchaseChalanNo && (
            <p className="text-[10px] text-left">চালান রেফারেন্স: #{data.purchaseChalanNo}</p>
          )}
        </div>

        {/* Supplier Details */}
        <div className="text-left text-[11px] pb-1 border-b border-dashed">
          <p>সরবরাহকারী: <b>{data.supplierCompany || data.supplierName}</b></p>
          {data.supplierPhone && <p>মোবাইল: {data.supplierPhone}</p>}
          <p>শাখা: {data.branchName}</p>
        </div>

        {/* Itemized Table */}
        <table className="w-full text-left border-collapse text-[11px]">
          <thead>
            <tr className="border-b font-semibold">
              <th className="py-1">বিবরণ</th>
              <th className="py-1 text-center">পরিমাণ</th>
              <th className="py-1 text-right">দর</th>
              <th className="py-1 text-right">মোট</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, idx) => (
              <tr key={idx} className="border-b border-neutral-200">
                <td className="py-1 pr-1">
                  <div>{item.productName}</div>
                  <span className="text-[9px] text-neutral-500">কারণ: {item.reason}</span>
                </td>
                <td className="py-1 text-center font-mono">{item.quantity}</td>
                <td className="py-1 text-right font-mono">{currencySymbol}{item.unitCost}</td>
                <td className="py-1 text-right font-mono font-medium">{currencySymbol}{item.lineTotal}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary Breakdown */}
        <div className="border-t pt-2 space-y-1 text-[11px] font-mono">
          <div className="flex justify-between font-bold text-xs">
            <span>মোট ফেরত মূল্য:</span>
            <span>{currencySymbol}{data.totalAmount.toFixed(2)}</span>
          </div>
          {data.dueDeduction > 0 && (
            <div className="flex justify-between text-neutral-700">
              <span>বাকি সমন্বয় (Deduction):</span>
              <span>- {currencySymbol}{data.dueDeduction.toFixed(2)}</span>
            </div>
          )}
          {data.refundAmount > 0 && (
            <div className="flex justify-between text-neutral-700">
              <span>নগদ গ্রহণ (Cash Refund):</span>
              <span>{currencySymbol}{data.refundAmount.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Signatures */}
        <div className="pt-8 flex justify-between text-[10px] text-center">
          <div className="border-t border-black w-24 pt-1">
            ম্যানেজার স্বাক্ষর
          </div>
          <div className="border-t border-black w-28 pt-1">
            সাপ্লায়ার প্রতিনিধির স্বাক্ষর
          </div>
        </div>
      </div>
    </div>
  );
}