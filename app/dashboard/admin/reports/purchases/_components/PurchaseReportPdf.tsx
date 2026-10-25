"use client";

import { IPurchaseReportKPIs, IPurchaseReportRow } from "@/types";

interface Props {
  kpis: IPurchaseReportKPIs;
  rows: IPurchaseReportRow[];
  currencySymbol: string;
  shop: { name: string; phone?: string | null; address?: string | null };
  branchName: string;
}

export default function PurchaseReportPdf({ kpis, rows, currencySymbol, shop, branchName }: Props) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 0 !important;
          }
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
          }
          body * {
            visibility: hidden !important;
          }
          #purchase-pdf-report, #purchase-pdf-report * {
            visibility: visible !important;
          }
          #purchase-pdf-report {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            display: block !important;
            padding: 10mm 12mm !important;
            box-sizing: border-box !important;
          }
        }
      `}} />

      <div id="purchase-pdf-report" className="hidden print:block font-sans text-xs">
        <div className="flex justify-between items-start border-b-2 border-black pb-3">
          <div>
            <h1 className="text-lg font-black uppercase">{shop.name}</h1>
            <p className="text-xs font-bold text-neutral-800">ব্রাঞ্চ: {branchName}</p>
            {shop.address && <p className="text-[10px] text-neutral-600">{shop.address}</p>}
          </div>
          <div className="text-right text-[10px]">
            <h2 className="text-sm font-black uppercase">পণ্য ক্রয় ও মহাজন দেনা বিবরণী</h2>
            <p>প্রিন্ট তারিখ: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 my-3 text-center text-xs">
          <div className="p-2 border border-neutral-300 rounded bg-neutral-50">
            <span className="block text-[9px] uppercase text-neutral-500 font-bold">মোট চালানের সংখ্যা</span>
            <span className="text-sm font-bold font-mono">{kpis.totalChalansCount} টি</span>
          </div>
          <div className="p-2 border border-neutral-300 rounded bg-neutral-50">
            <span className="block text-[9px] uppercase text-neutral-500 font-bold">মোট ক্রয় মান</span>
            <span className="text-sm font-bold font-mono">{currencySymbol}{kpis.totalPurchasesAmount.toFixed(2)}</span>
          </div>
          <div className="p-2 border border-neutral-300 rounded bg-neutral-50">
            <span className="block text-[9px] uppercase text-neutral-500 font-bold">পরিশোধিত অর্থ</span>
            <span className="text-sm font-bold font-mono text-emerald-700">{currencySymbol}{kpis.totalPaidAmount.toFixed(2)}</span>
          </div>
          <div className="p-2 border border-neutral-300 rounded bg-neutral-50">
            <span className="block text-[9px] uppercase text-neutral-500 font-bold">বকেয়া পাওনাদার দেনা</span>
            <span className="text-sm font-bold font-mono text-red-600">{currencySymbol}{kpis.totalDueAmount.toFixed(2)}</span>
          </div>
        </div>

        <table className="w-full text-left border-collapse border border-neutral-300 text-[10px]">
          <thead>
            <tr className="bg-neutral-100 font-bold border-b border-neutral-300">
              <th className="p-1 border-r border-neutral-300">#</th>
              <th className="p-1 border-r border-neutral-300">চালান নং</th>
              <th className="p-1 border-r border-neutral-300">তারিখ</th>
              <th className="p-1 border-r border-neutral-300">সাপ্লায়ার ও কোম্পানি</th>
              <th className="p-1 text-right border-r border-neutral-300">মোট মান</th>
              <th className="p-1 text-right border-r border-neutral-300">নগদ প্রদান</th>
              <th className="p-1 text-right border-r border-neutral-300">বকেয়া দেনা</th>
              <th className="p-1 text-center">অবস্থা</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.id} className="border-b border-neutral-200">
                <td className="p-1 border-r border-neutral-200 font-mono">{idx + 1}</td>
                <td className="p-1 border-r border-neutral-200 font-mono font-bold">{r.chalanNo}</td>
                <td className="p-1 border-r border-neutral-200">{new Date(r.purchaseDate).toLocaleDateString()}</td>
                <td className="p-1 border-r border-neutral-200">
                  <span className="font-bold">{r.supplierName}</span> {r.companyName && `(${r.companyName})`}
                </td>
                <td className="p-1 text-right border-r border-neutral-200 font-mono font-bold">
                  {currencySymbol}{r.grandTotal.toFixed(2)}
                </td>
                <td className="p-1 text-right border-r border-neutral-200 font-mono text-emerald-700">
                  {currencySymbol}{r.paidAmount.toFixed(2)}
                </td>
                <td className="p-1 text-right border-r border-neutral-200 font-mono font-bold text-red-600">
                  {currencySymbol}{r.dueAmount.toFixed(2)}
                </td>
                <td className="p-1 text-center uppercase font-mono font-semibold">{r.paymentStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-14 flex justify-between pt-4 border-t border-neutral-300 text-[10px]">
          <div className="text-center w-36 border-t border-black pt-1">হিসাবরক্ষক</div>
          <div className="text-center w-36 border-t border-black pt-1">ম্যানেজার</div>
          <div className="text-center w-36 border-t border-black pt-1">স্বত্বাধিকারী</div>
        </div>
      </div>
    </>
  );
}