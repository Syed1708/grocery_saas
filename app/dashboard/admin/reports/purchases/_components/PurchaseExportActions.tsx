"use client";

import { Printer, Download } from "lucide-react";
import { IPurchaseReportRow } from "@/types/purchases";
import { toast } from "sonner";

export default function PurchaseExportActions({ rows }: { rows: IPurchaseReportRow[] }) {
  const handlePrintPdf = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    if (!rows.length) {
      toast.error("No purchase chalans to export.");
      return;
    }

    const headers = [
      "ক্রমিক (SL)",
      "চালান নং (Chalan No)",
      "তারিখ (Date)",
      "সাপ্লায়ার (Supplier)",
      "কোম্পানি (Company)",
      "মোট পরিমাণ (Total Qty)",
      "আইটেম সংখ্যা (Items)",
      "মোট চালানের মান (Grand Total)",
      "পরিশোধ (Paid Amount)",
      "বকেয়া দেনা (Due Amount)",
      "পেমেন্ট মাধ্যম (Method)",
      "অবস্থা (Status)",
    ];

    const csvRows = rows.map((r, index) => [
      index + 1,
      `"${r.chalanNo}"`,
      new Date(r.purchaseDate).toLocaleDateString(),
      `"${r.supplierName.replace(/"/g, '""')}"`,
      `"${r.companyName || "N/A"}"`,
      r.totalQuantity,
      r.itemCount,
      r.grandTotal.toFixed(2),
      r.paidAmount.toFixed(2),
      r.dueAmount.toFixed(2),
      r.paymentMethod.toUpperCase(),
      r.paymentStatus,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...csvRows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `purchase-chalans-report-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Excel CSV file downloaded successfully!");
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleDownloadCsv}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 rounded-xl transition shadow-xs cursor-pointer"
      >
        <Download size={14} />
        <span>এক্সেল ডাউনলোড (Excel)</span>
      </button>

      <button
        onClick={handlePrintPdf}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 text-white rounded-xl transition shadow-xs cursor-pointer"
      >
        <Printer size={14} />
        <span>A4 অডিট প্রিন্ট (PDF)</span>
      </button>
    </div>
  );
}