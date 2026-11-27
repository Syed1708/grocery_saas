"use client";

import { Printer, Download } from "lucide-react";
import { IExpenseReportRow } from "@/types/expenses";
import { toast } from "sonner";
import { downloadCsv } from "@/lib/csv";

export default function ExpenseExportActions({
  getRows,
  onPrintRows,
}: {
  getRows: () => Promise<IExpenseReportRow[] | null>;
  onPrintRows: (rows: IExpenseReportRow[]) => void;
}) {
  const handlePrintPdf = async () => {
    const rows = await getRows();
    if (!rows || rows.length === 0) {
      toast.error("No expenses to print.");
      return;
    }
    onPrintRows(rows);
  };

  const handleDownloadCsv = async () => {
    const rows = await getRows();
    if (!rows || rows.length === 0) {
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
      r.voucherNo,
      new Date(r.expenseDate).toLocaleDateString(),
      r.categoryName,
      r.amount.toFixed(2),
      r.paymentMethod.toUpperCase(),
      r.reference || "N/A",
      r.note || "",
      r.spentBy || "N/A",
    ]);

    downloadCsv(
      `expense-report-${new Date().toISOString().split("T")[0]}.csv`,
      headers,
      csvRows
    );

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