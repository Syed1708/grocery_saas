"use client";

import { IProfitLossData } from "@/types/profit-loss";

interface Props {
  data: IProfitLossData;
  currencySymbol: string;
  shop: { name: string; phone?: string | null; address?: string | null };
  branchName: string;
}

export default function ProfitLossPdf({ data, currencySymbol, shop, branchName }: Props) {
  const isProfit = data.netProfit >= 0;

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
          #pl-pdf-report, #pl-pdf-report * {
            visibility: visible !important;
          }
          #pl-pdf-report {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            display: block !important;
            padding: 12mm 15mm !important;
            box-sizing: border-box !important;
          }
        }
      `}} />

      <div id="pl-pdf-report" className="hidden print:block font-sans text-xs">
        <div className="flex justify-between items-start border-b-2 border-black pb-3">
          <div>
            <h1 className="text-lg font-black uppercase">{shop.name}</h1>
            <p className="text-xs font-bold text-neutral-800">ব্রাঞ্চ: {branchName}</p>
            {shop.address && <p className="text-[10px] text-neutral-600">{shop.address}</p>}
          </div>
          <div className="text-right text-[10px]">
            <h2 className="text-sm font-black uppercase">লাভ-ক্ষতি আর্থিক বিবরণী (P&L Statement)</h2>
            <p>প্রিন্ট তারিখ: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Multi-step Statement Table */}
        <div className="my-4">
          <table className="w-full text-left border-collapse border border-neutral-300 text-xs">
            <tbody>
              {/* 1. Revenue */}
              <tr className="bg-neutral-100 font-bold border-b border-neutral-300">
                <td colSpan={2} className="p-2 uppercase">১. রাজস্ব ও বিক্রয় আয় (Operating Revenue)</td>
              </tr>
              <tr className="border-b border-neutral-200">
                <td className="p-2 pl-4">মোট বিক্রয় (Gross Sales)</td>
                <td className="p-2 text-right font-mono">{currencySymbol}{data.grossSales.toFixed(2)}</td>
              </tr>
              <tr className="border-b border-neutral-200">
                <td className="p-2 pl-4">বাদ: বিক্রয় ছাড় (Discounts Given)</td>
                <td className="p-2 text-right font-mono text-red-600">-{currencySymbol}{data.salesDiscount.toFixed(2)}</td>
              </tr>
              <tr className="border-b border-neutral-200">
                <td className="p-2 pl-4">বাদ: বিক্রিত পণ্য ফেরত (Sales Returns)</td>
                <td className="p-2 text-right font-mono text-red-600">-{currencySymbol}{data.salesReturns.toFixed(2)}</td>
              </tr>
              <tr className="font-bold border-b border-neutral-300 bg-neutral-50">
                <td className="p-2">প্রকৃত বিক্রয় আয় (Net Sales Revenue)</td>
                <td className="p-2 text-right font-mono">{currencySymbol}{data.netSalesRevenue.toFixed(2)}</td>
              </tr>

              {/* 2. COGS */}
              <tr className="bg-neutral-100 font-bold border-b border-neutral-300">
                <td colSpan={2} className="p-2 uppercase">২. বিক্রিত পণ্যের ক্রয়মূল্য (Cost of Goods Sold - COGS)</td>
              </tr>
              <tr className="border-b border-neutral-200">
                <td className="p-2 pl-4">পণ্য ক্রয় খরচ (Purchase Cost of Items Sold)</td>
                <td className="p-2 text-right font-mono">{currencySymbol}{data.cogsAmount.toFixed(2)}</td>
              </tr>
              <tr className="border-b border-neutral-200">
                <td className="p-2 pl-4">বাদ: রিস্টককৃত পণ্য ফেরত সমন্বয়</td>
                <td className="p-2 text-right font-mono text-emerald-700">-{currencySymbol}{data.cogsRestockAdjustment.toFixed(2)}</td>
              </tr>
              <tr className="font-bold border-b border-neutral-300 bg-neutral-50">
                <td className="p-2">মোট COGS ব্যয় (Net COGS)</td>
                <td className="p-2 text-right font-mono">{currencySymbol}{data.netCogs.toFixed(2)}</td>
              </tr>

              {/* 3. Gross Profit */}
              <tr className="font-black border-b-2 border-black bg-blue-50 text-sm">
                <td className="p-2.5">মোট লাভ (Gross Profit) [মার্জিন: {data.grossMarginPercent}%]</td>
                <td className="p-2.5 text-right font-mono">{currencySymbol}{data.grossProfit.toFixed(2)}</td>
              </tr>

              {/* 4. Operating Expenses */}
              <tr className="bg-neutral-100 font-bold border-b border-neutral-300">
                <td colSpan={2} className="p-2 uppercase">৩. দোকান পরিচালন ব্যয় (Operating Expenses - OPEX)</td>
              </tr>
              {data.expenseCategories.map((c) => (
                <tr key={c.categoryId} className="border-b border-neutral-200">
                  <td className="p-2 pl-4">{c.categoryName}</td>
                  <td className="p-2 text-right font-mono">{currencySymbol}{c.totalAmount.toFixed(2)}</td>
                </tr>
              ))}
              <tr className="border-b border-neutral-200">
                <td className="p-2 pl-4">স্টাফ বেতন ও ভাতা (Staff Payroll)</td>
                <td className="p-2 text-right font-mono">{currencySymbol}{data.payrollExpenses.toFixed(2)}</td>
              </tr>
              <tr className="border-b border-neutral-200">
                <td className="p-2 pl-4">নষ্ট পণ্যের ক্ষতি (Damaged Goods Write-off)</td>
                <td className="p-2 text-right font-mono">{currencySymbol}{data.damagedGoodsLoss.toFixed(2)}</td>
              </tr>
              <tr className="font-bold border-b border-neutral-300 bg-neutral-50">
                <td className="p-2">মোট পরিচালন ব্যয় (Total Operating Expenses)</td>
                <td className="p-2 text-right font-mono text-red-600">-{currencySymbol}{data.totalOpex.toFixed(2)}</td>
              </tr>

              {/* 5. Other Income */}
              <tr className="border-b border-neutral-200">
                <td className="p-2 font-bold">অন্যান্য ব্যবসায়িক আয় (Other Non-Operating Income)</td>
                <td className="p-2 text-right font-mono font-bold text-emerald-700">+{currencySymbol}{data.otherIncome.toFixed(2)}</td>
              </tr>

              {/* 6. Net Profit */}
              <tr className={`font-black border-t-2 border-b-2 border-black text-base ${isProfit ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
                <td className="p-3">সর্বমোট প্রকৃত লাভ / ক্ষতি (Net Profit / Loss) [মার্জিন: {data.netMarginPercent}%]</td>
                <td className="p-3 text-right font-mono">{currencySymbol}{data.netProfit.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-14 flex justify-between pt-4 border-t border-neutral-300 text-[10px]">
          <div className="text-center w-36 border-t border-black pt-1">হিসাবরক্ষক</div>
          <div className="text-center w-36 border-t border-black pt-1">ম্যানেজার</div>
          <div className="text-center w-36 border-t border-black pt-1">স্বত্বাধিকারী</div>
        </div>
      </div>
    </>
  );
}