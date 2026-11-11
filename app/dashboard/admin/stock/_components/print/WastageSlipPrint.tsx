"use client";

import React from "react";
import { IStockWastage } from "@/types/stock-wastage";

interface Props {
  data: IStockWastage | null;
  shopName: string;
  currencySymbol?: string;
}

export default function WastageSlipPrint({
  data,
  shopName,
  currencySymbol = "৳",
}: Props) {
  if (!data) return null;

  return (
    <div
      id="printable-wastage-slip"
      className="hidden print:block fixed inset-0 bg-white text-black p-4 z-9999 font-mono text-[10px]"
    >
      <div className="max-w-[80mm] mx-auto space-y-2 text-center">
        <div className="border-b pb-1">
          <h1 className="text-xs font-bold uppercase">{shopName}</h1>
          <p className="text-[9px]">নষ্ট ও ক্ষতিপূরণ স্লিপ (STOCK WRITE-OFF)</p>
          <div className="flex justify-between text-[8px] mt-1 pt-1 border-t border-dashed">
            <span>ভাউচার: <b>#{data.wastageNo}</b></span>
            <span>{new Date(data.date).toLocaleDateString()}</span>
          </div>
          <p className="text-[8px] text-left">শাখা: {data.branchName}</p>
        </div>

        <table className="w-full text-left border-collapse text-[9px]">
          <thead>
            <tr className="border-b font-semibold">
              <th className="py-1">পণ্য</th>
              <th className="py-1 text-center">পরিমাণ</th>
              <th className="py-1 text-right">ক্ষতি</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((i, idx) => (
              <tr key={idx} className="border-b border-neutral-200">
                <td className="py-1 truncate max-w-[120px]">{i.productName}</td>
                <td className="py-1 text-center">{i.quantity}</td>
                <td className="py-1 text-right font-bold">{currencySymbol}{i.lineCost.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t pt-1 flex justify-between font-bold text-xs">
          <span>মোট আর্থিক ক্ষতি:</span>
          <span>{currencySymbol}{data.totalCost.toFixed(2)}</span>
        </div>

        <p className="text-[8px] text-left pt-1 italic text-neutral-600">
          * এই মালামাল সেলফ থেকে বাদ দেওয়া হয়েছে এবং ক্ষতি হিসেবে পিএন্ডএল-এ অন্তর্ভুক্ত করা হয়েছে।
        </p>

        <div className="pt-6 flex justify-between text-[8px]">
          <div className="border-t border-black w-20 pt-1 text-center">ইনচার্জ স্বাক্ষর</div>
          <div className="border-t border-black w-20 pt-1 text-center">ম্যানেজার অনুমোদন</div>
        </div>
      </div>
    </div>
  );
}