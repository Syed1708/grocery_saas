"use client";

import React from "react";
import { IStockTransfer } from "@/types/stock-transfer";

interface Props {
  data: IStockTransfer | null;
  shopName: string;
  currencySymbol?: string;
}

export default function TransferChalanPrint({
  data,
  shopName,
  currencySymbol = "৳",
}: Props) {
  if (!data) return null;

  const hasDamage = data.items.some((i) => Number(i.transitDamage || 0) > 0);

  return (
    <div
      id="printable-transfer-chalan"
      className="hidden print:block fixed inset-0 bg-white text-black p-4 z-9999 font-sans text-xs"
    >
      <div className="max-w-2xl mx-auto space-y-4 border p-6 rounded">
        <div className="border-b pb-3 text-center">
          <h1 className="text-lg font-black uppercase">{shopName}</h1>
          <p className="font-bold text-xs uppercase text-neutral-600 tracking-wider">
            আন্তঃশাখা পণ্য স্থানান্তর চালান ও গেট পাস (Transfer Chalan / Gate Pass)
          </p>
          <div className="flex justify-between text-[11px] pt-2 border-t border-dashed mt-2 font-mono">
            <span>চালান নং: <b>#{data.transferNo}</b></span>
            <span>তারিখ: {new Date(data.dispatchDate).toLocaleDateString("bn-BD")}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs p-3 bg-neutral-50 border rounded font-mono">
          <div>
            <span className="text-[10px] text-neutral-400 block uppercase">প্রেরক শাখা (Source):</span>
            <strong className="text-sm block">{data.fromBranchName}</strong>
            <p className="text-[10px] mt-1">গাড়ি নং: {data.vehicleNo || "N/A"}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-neutral-400 block uppercase">প্রাপক শাখা (Destination):</span>
            <strong className="text-sm block">{data.toBranchName}</strong>
            <p className="text-[10px] mt-1">ড্রাইভার: {data.driverName || "N/A"} ({data.driverPhone || ""})</p>
          </div>
        </div>

        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-y bg-neutral-100 font-bold">
              <th className="py-2 px-2">#</th>
              <th className="py-2 px-2">পণ্যের বিবরণ</th>
              <th className="py-2 px-2 text-center">প্রেরিত</th>
              <th className="py-2 px-2 text-center">গৃহীত</th>
              {hasDamage && <th className="py-2 px-2 text-center text-red-600">নষ্ট (Damage)</th>}
              <th className="py-2 px-2 text-right">দর</th>
              <th className="py-2 px-2 text-right">মোট</th>
            </tr>
          </thead>
          <tbody className="divide-y font-mono">
            {data.items.map((it, idx) => (
              <tr key={idx}>
                <td className="py-2 px-2">{idx + 1}</td>
                <td className="py-2 px-2 font-sans font-medium">
                  {it.productName}
                  {it.transitDamage > 0 && (
                    <span className="text-[9px] text-red-600 block">
                      * {it.transitDamage} টি নষ্ট ([{data.fromBranchName}] থেকে আগত)
                    </span>
                  )}
                </td>
                <td className="py-2 px-2 text-center">{it.quantitySent}</td>
                <td className="py-2 px-2 text-center font-bold">
                  {it.quantityReceived !== null ? it.quantityReceived : it.quantitySent}
                </td>
                {hasDamage && (
                  <td className="py-2 px-2 text-center text-red-600 font-bold">
                    {it.transitDamage > 0 ? it.transitDamage : "0"}
                  </td>
                )}
                <td className="py-2 px-2 text-right">{currencySymbol}{it.unitCost.toFixed(2)}</td>
                <td className="py-2 px-2 text-right font-bold">{currencySymbol}{it.lineCost.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {hasDamage && (
          <div className="p-2 border border-dashed border-red-300 bg-red-50 text-[10px] text-red-700">
            * পরিবহনের সময় নষ্ট হওয়া পণ্যগুলো <b>{data.fromBranchName}</b> থেকে প্রাপ্তির সময় ক্ষতি হিসেবে বাদ দেওয়া হয়েছে এবং {data.toBranchName} এর অপচয় লগ (Wastage)-এ রেকর্ড হয়েছে।
          </div>
        )}

        <div className="border-t pt-2 flex justify-between font-mono font-bold text-xs">
          <span>মোট আইটেম: {data.items.length} টি</span>
          <span>সর্বমোট মূল্য: {currencySymbol}{data.totalCost.toFixed(2)}</span>
        </div>

        <div className="grid grid-cols-3 gap-6 text-center text-[10px] pt-12">
          <div className="border-t border-black pt-1">প্রেরকের স্বাক্ষর ({data.fromBranchName})</div>
          <div className="border-t border-black pt-1">ড্রাইভারের স্বাক্ষর</div>
          <div className="border-t border-black pt-1">প্রাপকের স্বাক্ষর ({data.toBranchName})</div>
        </div>
      </div>
    </div>
  );
}