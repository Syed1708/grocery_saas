"use client";

import { Printer, Download } from "lucide-react";
import { IProfitLossData } from "@/types/profit-loss";
import { toast } from "sonner";

export default function ProfitLossExportActions({ data }: { data: IProfitLossData }) {
  const handlePrintPdf = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    const csvRows = [
      ["আর্থিক বিবরণী হিসাব (Particulars)", "পরিমাণ (Amount / BDT)"],
      ["১. মোট বিক্রয় (Gross Sales)", data.grossSales.toFixed(2)],
      ["বাদ: বিক্রয় ছাড় (Discounts)", `-${data.salesDiscount.toFixed(2)}`],
      ["বাদ: পণ্য ফেরত (Returns)", `-${data.salesReturns.toFixed(2)}`],
      ["প্রকৃত বিক্রয় আয় (Net Sales Revenue)", data.netSalesRevenue.toFixed(2)],
      ["", ""],
      ["২. বিক্রিত পণ্যের ক্রয়মূল্য (COGS)", data.cogsAmount.toFixed(2)],
      ["বাদ: রিস্টক সমন্বয় (Restock Adjustment)", `-${data.cogsRestockAdjustment.toFixed(2)}`],
      ["মোট COGS ব্যয় (Net COGS)", data.netCogs.toFixed(2)],
      ["", ""],
      ["মোট লাভ (Gross Profit)", data.grossProfit.toFixed(2)],
      ["মোট মার্জিন % (Gross Margin)", `${data.grossMarginPercent}%`],
      ["", ""],
      ["৩. দোকান পরিচালন খরচ (Operating Expenses)", data.operatingExpenses.toFixed(2)],
      ["স্টাফ বেতন ও ভাতা (Payroll)", data.payrollExpenses.toFixed(2)],
      ["নষ্ট পণ্য বাবদ ক্ষতি (Damaged Goods)", data.damagedGoodsLoss.toFixed(2)],
      ["মোট পরিচালন ব্যয় (Total OPEX)", data.totalOpex.toFixed(2)],
      ["", ""],
      ["৪. অন্যান্য আয় (Other Income)", data.otherIncome.toFixed(2)],
      ["", ""],
      ["সর্বমোট প্রকৃত লাভ / ক্ষতি (Net Profit / Loss)", data.netProfit.toFixed(2)],
      ["প্রকৃত লাভ মার্জিন % (Net Margin)", `${data.netMarginPercent}%`],
    ];

    const csvContent = "\uFEFF" + csvRows.map((e) => `"${e[0]}","${e[1]}"`).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `profit-loss-statement-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("P&L statement exported to Excel successfully!");
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleDownloadCsv}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 rounded-xl transition shadow-xs cursor-pointer"
      >
        <Download size={14} />
        <span>এক্সেল ডাউনলোড (Excel)</span>
      </button>

      <button
        type="button"
        onClick={handlePrintPdf}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 text-white rounded-xl transition shadow-xs cursor-pointer"
      >
        <Printer size={14} />
        <span>A4 স্টেটমেন্ট প্রিন্ট (PDF)</span>
      </button>
    </div>
  );
}