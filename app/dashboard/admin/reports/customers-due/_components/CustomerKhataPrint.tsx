"use client";

import { ICustomerDueRow, ICustomerKhataEntry } from "@/types/index";

interface Props {
  customer: ICustomerDueRow | null;
  ledger: ICustomerKhataEntry[];
  currencySymbol: string;
  shopName: string;
  branchName?: string;
  printFormat: "thermal" | "a4";
}

export default function CustomerKhataPrint({
  customer,
  ledger = [],
  currencySymbol = "৳",
  shopName,
  branchName = "Main Branch",
  printFormat = "thermal",
}: Props) {
  if (!customer) return null;

  const isThermal = printFormat === "thermal";

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: ${isThermal ? "80mm auto" : "A4 portrait"};
                margin: ${isThermal ? "0" : "12mm 15mm"} !important;
              }
              body {
                background: white !important;
                color: black !important;
                margin: 0 !important;
              }
              body * {
                visibility: hidden !important;
              }
              #print-khata-container, #print-khata-container * {
                visibility: visible !important;
              }
              #print-khata-container {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: ${isThermal ? "78mm" : "100%"} !important;
                display: block !important;
                padding: ${isThermal ? "6px" : "0"} !important;
                box-sizing: border-box !important;
              }
            }
          `,
        }}
      />

      <div id="print-khata-container" className="hidden print:block text-black select-none">
        {isThermal ? (
          /* ==================== 80MM COMPACT THERMAL SLIP ==================== */
          <div className="font-mono text-[10px] leading-tight space-y-2">
            <div className="text-center pb-2 border-b border-dashed border-black">
              <h2 className="font-black text-xs uppercase">{shopName}</h2>
              <p className="text-[9px]">শাখা: {branchName}</p>
              <p className="font-bold text-[10px] mt-0.5">কাস্টমার বাকি খাতা রসিদ</p>
              <p className="text-[9px]">তারিখ: {new Date().toLocaleDateString()}</p>
            </div>

            <div className="pb-1 border-b border-dashed border-black space-y-0.5 text-[9px]">
              <p><strong>গ্রাহক:</strong> {customer.name}</p>
              {customer.phone && <p><strong>ফোন:</strong> {customer.phone}</p>}
              {(customer.village || customer.address) && (
                <p><strong>ঠিকানা:</strong> {customer.village || customer.address}</p>
              )}
            </div>

            <div className="py-1 border-b border-dashed border-black space-y-1">
              <div className="flex justify-between font-bold border-b border-black pb-0.5">
                <span>বিবরণ / ইনভয়েস</span>
                <span>বাকি / চলতি</span>
              </div>
              {ledger.map((l) => (
                <div key={l.id} className="text-[9px] border-b border-dotted border-neutral-300 pb-0.5">
                  <div className="flex justify-between">
                    <span>{new Date(l.date).toLocaleDateString([], { month: "numeric", day: "numeric" })} {l.referenceNo}</span>
                    <span className="font-bold">
                      {l.debit > 0 ? `+${currencySymbol}${l.debit.toFixed(0)}` : l.credit > 0 ? `-${currencySymbol}${l.credit.toFixed(0)}` : "নগদ রিফান্ড"}
                    </span>
                  </div>
                  <div className="flex justify-between text-[8px] text-neutral-600">
                    <span>{l.title}</span>
                    <span>জের: {currencySymbol}{l.balance.toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="py-2 border-b-2 border-black space-y-1">
              <div className="flex justify-between font-black text-xs">
                <span>সর্বমোট বর্তমান বাকি:</span>
                <span>{currencySymbol}{customer.currentDue.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-2 text-center text-[9px]">
              <p>বকেয়া টাকা দ্রুত পরিশোধের অনুরোধ রইল।</p>
              <p className="mt-4 border-t border-black pt-1">স্বাক্ষর</p>
            </div>
          </div>
        ) : (
          /* ==================== A4 FORMAL STATEMENT ==================== */
          <div className="font-sans text-xs space-y-4">
            <div className="flex justify-between items-start border-b-2 border-black pb-3">
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight">{shopName}</h1>
                <p className="text-xs text-neutral-600">শাখা: {branchName}</p>
                <p className="text-xs font-bold text-neutral-800 mt-1">কাস্টমার বাকি খাতা অডিট বিবরণী (Ledger Statement)</p>
              </div>
              <div className="text-right text-[10px]">
                <p>তারিখ: {new Date().toLocaleDateString()}</p>
                <p>কাস্টমার টাইপ: {customer.type === "PERMANENT" ? "স্থায়ী" : "চলতি"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-3 bg-neutral-100 border border-neutral-300 rounded text-xs">
              <div>
                <p><strong>গ্রাহকের নাম:</strong> {customer.name}</p>
                <p><strong>মোবাইল নম্বর:</strong> {customer.phone || "N/A"}</p>
                <p><strong>গ্রাম/ঠিকানা:</strong> {customer.village || customer.address || "N/A"}</p>
              </div>
              <div className="text-right">
                <p><strong>বাকি লিমিট:</strong> {currencySymbol}{customer.creditLimit.toFixed(2)}</p>
                <p className="text-sm font-bold text-red-600 mt-1">
                  সর্বমোট বর্তমান দেনা: {currencySymbol}{customer.currentDue.toFixed(2)}
                </p>
              </div>
            </div>

            <table className="w-full text-left border-collapse border border-neutral-300 text-[10px]">
              <thead>
                <tr className="bg-neutral-200 font-bold border-b border-neutral-300">
                  <th className="p-1.5 border-r border-neutral-300">তারিখ</th>
                  <th className="p-1.5 border-r border-neutral-300">ভাউচার / ইনভয়েস নং</th>
                  <th className="p-1.5 border-r border-neutral-300">লেনদেনের বিবরণী</th>
                  <th className="p-1.5 text-right border-r border-neutral-300">মোট বিল</th>
                  <th className="p-1.5 text-right border-r border-neutral-300">নগদ জমা</th>
                  <th className="p-1.5 text-right border-r border-neutral-300">বাকি বৃদ্ধি (+)</th>
                  <th className="p-1.5 text-right border-r border-neutral-300">বাকি হ্রাস (-)</th>
                  <th className="p-1.5 text-right">চলতি জের (Due)</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((entry) => (
                  <tr key={entry.id} className="border-b border-neutral-200">
                    <td className="p-1.5 border-r border-neutral-200 font-mono">{new Date(entry.date).toLocaleDateString()}</td>
                    <td className="p-1.5 border-r border-neutral-200 font-mono font-semibold">{entry.referenceNo}</td>
                    <td className="p-1.5 border-r border-neutral-200">{entry.title}</td>
                    <td className="p-1.5 text-right border-r border-neutral-200 font-mono">
                      {entry.invoiceTotal ? `${currencySymbol}${entry.invoiceTotal.toFixed(2)}` : "-"}
                    </td>
                    <td className="p-1.5 text-right border-r border-neutral-200 font-mono">
                      {entry.paidAtPos ? `${currencySymbol}${entry.paidAtPos.toFixed(2)}` : "-"}
                    </td>
                    <td className="p-1.5 text-right border-r border-neutral-200 font-mono font-bold">
                      {entry.debit > 0 ? `${currencySymbol}${entry.debit.toFixed(2)}` : "-"}
                    </td>
                    <td className="p-1.5 text-right border-r border-neutral-200 font-mono font-bold text-emerald-600">
                      {entry.credit > 0 ? `${currencySymbol}${entry.credit.toFixed(2)}` : "-"}
                    </td>
                    <td className="p-1.5 text-right font-mono font-black">
                      {currencySymbol}{entry.balance.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-16 flex justify-between pt-6 border-t border-neutral-300 text-[10px]">
              <div className="text-center w-36 border-t border-black pt-1">গ্রাহকের স্বাক্ষর</div>
              <div className="text-center w-36 border-t border-black pt-1">দোকানদারের স্বাক্ষর</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}