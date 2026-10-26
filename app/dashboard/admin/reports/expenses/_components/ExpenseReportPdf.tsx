"use client";

import { IExpenseReportKPIs, IExpenseReportRow, IExpenseCategoryStat } from "@/types/expenses";

interface Props {
  kpis: IExpenseReportKPIs;
  rows: IExpenseReportRow[];
  categoryStats: IExpenseCategoryStat[];
  currencySymbol: string;
  shop: { name: string; phone?: string | null; address?: string | null };
  branchName: string;
}

export default function ExpenseReportPdf({
  kpis,
  rows,
  categoryStats,
  currencySymbol,
  shop,
  branchName,
}: Props) {
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
          #expense-pdf-report, #expense-pdf-report * {
            visibility: visible !important;
          }
          #expense-pdf-report {
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

      <div id="expense-pdf-report" className="hidden print:block font-sans text-xs">
        <div className="flex justify-between items-start border-b-2 border-black pb-3">
          <div>
            <h1 className="text-lg font-black uppercase">{shop.name}</h1>
            <p className="text-xs font-bold text-neutral-800">ব্রাঞ্চ: {branchName}</p>
            {shop.address && <p className="text-[10px] text-neutral-600">{shop.address}</p>}
          </div>
          <div className="text-right text-[10px]">
            <h2 className="text-sm font-black uppercase">দোকান পরিচালন ব্যয় ও ভাউচার বিবরণী</h2>
            <p>প্রিন্ট তারিখ: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-4 gap-2 my-3 text-center text-xs">
          <div className="p-2 border border-neutral-300 rounded bg-neutral-50">
            <span className="block text-[9px] uppercase text-neutral-500 font-bold">মোট খরচ ভাউচার</span>
            <span className="text-sm font-bold font-mono">{kpis.totalVouchersCount} টি</span>
          </div>
          <div className="p-2 border border-neutral-300 rounded bg-neutral-50">
            <span className="block text-[9px] uppercase text-neutral-500 font-bold">সর্বমোট খরচ</span>
            <span className="text-sm font-bold font-mono text-red-600">{currencySymbol}{kpis.totalExpenseAmount.toFixed(2)}</span>
          </div>
          <div className="p-2 border border-neutral-300 rounded bg-neutral-50">
            <span className="block text-[9px] uppercase text-neutral-500 font-bold">ক্যাশ ড্রয়ার থেকে ব্যয়</span>
            <span className="text-sm font-bold font-mono">{currencySymbol}{kpis.cashExpenseAmount.toFixed(2)}</span>
          </div>
          <div className="p-2 border border-neutral-300 rounded bg-neutral-50">
            <span className="block text-[9px] uppercase text-neutral-500 font-bold">ব্যাংক / ওয়ালেট ব্যয়</span>
            <span className="text-sm font-bold font-mono">{currencySymbol}{(kpis.bankExpenseAmount + kpis.otherMethodExpenseAmount).toFixed(2)}</span>
          </div>
        </div>

        {/* Category Breakdown Table */}
        <div className="mb-4">
          <h3 className="font-bold text-[11px] mb-1 uppercase">খাতভিত্তিক খরচের সারসংক্ষেপ (Category Summary):</h3>
          <table className="w-full text-left border-collapse border border-neutral-300 text-[10px]">
            <thead>
              <tr className="bg-neutral-100 font-bold border-b border-neutral-300">
                <th className="p-1 border-r border-neutral-300">খরচের খাত</th>
                <th className="p-1 text-center border-r border-neutral-300">ভাউচার সংখ্যা</th>
                <th className="p-1 text-right border-r border-neutral-300">মোট টাকা</th>
                <th className="p-1 text-right">শতাংশ (%)</th>
              </tr>
            </thead>
            <tbody>
              {categoryStats.map((c) => (
                <tr key={c.categoryId} className="border-b border-neutral-200">
                  <td className="p-1 border-r border-neutral-200">{c.categoryName}</td>
                  <td className="p-1 text-center border-r border-neutral-200 font-mono">{c.vouchersCount}</td>
                  <td className="p-1 text-right border-r border-neutral-200 font-mono">{currencySymbol}{c.totalAmount.toFixed(2)}</td>
                  <td className="p-1 text-right font-mono font-bold">{c.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detailed Voucher List */}
        <div>
          <h3 className="font-bold text-[11px] mb-1 uppercase">সকল খরচের ভাউচার তালিকা (Granular Vouchers):</h3>
          <table className="w-full text-left border-collapse border border-neutral-300 text-[10px]">
            <thead>
              <tr className="bg-neutral-100 font-bold border-b border-neutral-300">
                <th className="p-1 border-r border-neutral-300">#</th>
                <th className="p-1 border-r border-neutral-300">ভাউচার নং</th>
                <th className="p-1 border-r border-neutral-300">তারিখ</th>
                <th className="p-1 border-r border-neutral-300">খাত</th>
                <th className="p-1 border-r border-neutral-300">পদ্ধতি</th>
                <th className="p-1 text-right border-r border-neutral-300">পরিমাণ</th>
                <th className="p-1">রেফারেন্স / নোট</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={r.id} className="border-b border-neutral-200">
                  <td className="p-1 border-r border-neutral-200 font-mono">{idx + 1}</td>
                  <td className="p-1 border-r border-neutral-200 font-mono font-bold">{r.voucherNo}</td>
                  <td className="p-1 border-r border-neutral-200 font-mono">{new Date(r.expenseDate).toLocaleDateString()}</td>
                  <td className="p-1 border-r border-neutral-200">{r.categoryName}</td>
                  <td className="p-1 border-r border-neutral-200 uppercase font-mono">{r.paymentMethod}</td>
                  <td className="p-1 text-right border-r border-neutral-200 font-mono font-bold text-red-600">
                    {currencySymbol}{r.amount.toFixed(2)}
                  </td>
                  <td className="p-1">{r.reference ? `${r.reference} - ` : ""}{r.note || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-14 flex justify-between pt-4 border-t border-neutral-300 text-[10px]">
          <div className="text-center w-36 border-t border-black pt-1">হিসাবরক্ষক</div>
          <div className="text-center w-36 border-t border-black pt-1">ম্যানেজার</div>
          <div className="text-center w-36 border-t border-black pt-1">অনুমোদন (স্বত্বাধিকারী)</div>
        </div>
      </div>
    </>
  );
}