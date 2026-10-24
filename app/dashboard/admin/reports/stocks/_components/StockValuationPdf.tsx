"use client";

import { IStockReportKPIs, IStockReportRow } from "@/types/stock";

interface Props {
  kpis: IStockReportKPIs;
  rows: IStockReportRow[];
  currencySymbol: string;
  shop: {
    name: string;
    phone?: string | null;
    address?: string | null;
  };
  branchName: string;
}

export default function StockValuationPdf({ kpis, rows, currencySymbol, shop, branchName }: Props) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 landscape;
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
          #stock-pdf-report, #stock-pdf-report * {
            visibility: visible !important;
          }
          #stock-pdf-report {
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

      <div id="stock-pdf-report" className="hidden print:block font-sans text-xs">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-black pb-3">
          <div>
            <h1 className="text-lg font-black uppercase">{shop.name}</h1>
            <p className="text-xs font-bold text-neutral-800">ব্রাঞ্চ: {branchName}</p>
            {shop.address && <p className="text-[10px] text-neutral-600">{shop.address}</p>}
          </div>
          <div className="text-right text-[10px]">
            <h2 className="text-sm font-black uppercase">মজুদ পণ্য ও ইনভেন্টরি অডিট বিবরণী</h2>
            <p>প্রিন্ট তারিখ: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Valuation KPI Boxes */}
        <div className="grid grid-cols-4 gap-2 my-3 text-center text-xs">
          <div className="p-2 border border-neutral-300 rounded bg-neutral-50">
            <span className="block text-[9px] uppercase text-neutral-500 font-bold">মোট পণ্যের আইটেম</span>
            <span className="text-sm font-bold font-mono">{kpis.totalProductsCount} টি ({kpis.totalStockUnits} একক)</span>
          </div>
          <div className="p-2 border border-neutral-300 rounded bg-neutral-50">
            <span className="block text-[9px] uppercase text-neutral-500 font-bold">ক্রয় মূল্যে মজুদ (Cost)</span>
            <span className="text-sm font-bold font-mono">{currencySymbol}{kpis.totalCostValue.toFixed(2)}</span>
          </div>
          <div className="p-2 border border-neutral-300 rounded bg-neutral-50">
            <span className="block text-[9px] uppercase text-neutral-500 font-bold">বিক্রয় মূল্যে মজুদ (Retail)</span>
            <span className="text-sm font-bold font-mono">{currencySymbol}{kpis.totalRetailValue.toFixed(2)}</span>
          </div>
          <div className="p-2 border border-neutral-300 rounded bg-neutral-50">
            <span className="block text-[9px] uppercase text-neutral-500 font-bold">প্রত্যাশিত মোট লাভ</span>
            <span className="text-sm font-bold font-mono text-emerald-700">{currencySymbol}{kpis.potentialGrossProfit.toFixed(2)}</span>
          </div>
        </div>

        {/* Table for Physical Stock Counting */}
        <table className="w-full text-left border-collapse border border-neutral-300 text-[10px]">
          <thead>
            <tr className="bg-neutral-100 font-bold border-b border-neutral-300">
              <th className="p-1 border-r border-neutral-300">#</th>
              <th className="p-1 border-r border-neutral-300">পণ্য ও বারকোড</th>
              <th className="p-1 border-r border-neutral-300">তাক</th>
              <th className="p-1 text-right border-r border-neutral-300">ক্রয় মূল্য</th>
              <th className="p-1 text-right border-r border-neutral-300">বিক্রয় মূল্য</th>
              <th className="p-1 text-right border-r border-neutral-300">সিস্টেম স্টক</th>
              <th className="p-1 text-center border-r border-neutral-300 w-24">ফিজিক্যাল গণনা (বাস্তব)</th>
              <th className="p-1 text-right border-r border-neutral-300">মোট ক্রয় মান</th>
              <th className="p-1 text-center">মেয়াদ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.stockId} className="border-b border-neutral-200">
                <td className="p-1 border-r border-neutral-200 font-mono">{idx + 1}</td>
                <td className="p-1 border-r border-neutral-200">
                  <span className="font-bold">{r.productName}</span>
                  <span className="block text-[9px] text-neutral-500 font-mono">{r.barcode}</span>
                </td>
                <td className="p-1 border-r border-neutral-200 font-mono">{r.sectionCode || "-"}</td>
                <td className="p-1 text-right border-r border-neutral-200 font-mono">{currencySymbol}{r.purchasePrice.toFixed(2)}</td>
                <td className="p-1 text-right border-r border-neutral-200 font-mono">{currencySymbol}{r.sellingPrice.toFixed(2)}</td>
                <td className="p-1 text-right border-r border-neutral-200 font-mono font-bold">
                  {r.quantity} {r.unitCode}
                </td>
                <td className="p-1 border-r border-neutral-200 border-dashed"></td>
                <td className="p-1 text-right border-r border-neutral-200 font-mono font-bold">{currencySymbol}{r.totalCostValue.toFixed(2)}</td>
                <td className="p-1 text-center font-mono text-[9px]">
                  {r.expiryDate ? new Date(r.expiryDate).toLocaleDateString() : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Audit Signatures */}
        <div className="mt-12 flex justify-between pt-4 border-t border-neutral-300 text-[10px]">
          <div className="text-center w-36 border-t border-black pt-1">স্টক গণনাকারী (স্টোর বয়)</div>
          <div className="text-center w-36 border-t border-black pt-1">যাচাইকারী (ম্যানেজার)</div>
          <div className="text-center w-36 border-t border-black pt-1">অনুমোদন (স্বত্বাধিকারী)</div>
        </div>
      </div>
    </>
  );
}