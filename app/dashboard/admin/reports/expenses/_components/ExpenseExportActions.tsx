"use client";

import { Printer, Download } from "lucide-react";
import { IExpenseReportRow } from "@/types/expenses";
import { toast } from "sonner";

export default function ExpenseExportActions({ rows }: { rows: IExpenseReportRow[] }) {
  const handlePrintPdf = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    if (!rows.length) {
      toast.error("No expenses to export.");
      return;
    }

    const headers = [
      "ক্রমিক (SL)",
      "ভাউচার নং (Voucher No)",
      "তারিখ (Date)",
      "খরচের খাত (Category)",
      "পরিমাণ (Amount / BDT)",
      "পেমেন্ট মাধ্যম (Payment Method)",
      "রেফারেন্স (Reference)",
      "বিবরণী / নোট (Notes)",
      "ব্যয়কারী (Spent By)",
    ];

    const csvRows = rows.map((r, index) => [
      index + 1,
      `"${r.voucherNo}"`,
      new Date(r.expenseDate).toLocaleDateString(),
      `"${r.categoryName}"`,
      r.amount.toFixed(2),
      r.paymentMethod.toUpperCase(),
      `"${r.reference || "N/A"}"`,
      `"${(r.note || "").replace(/"/g, '""')}"`,
      `"${r.spentBy || "N/A"}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...csvRows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `expense-report-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Expense report exported to Excel successfully!");
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
        <span>A4 অডিট প্রিন্ট (PDF)</span>
      </button>
    </div>
  );
}