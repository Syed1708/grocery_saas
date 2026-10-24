"use client";

import { Printer, Download } from "lucide-react";
import { IStockReportRow } from "@/types/stock";
import { toast } from "sonner";

export default function StockExportActions({ rows }: { rows: IStockReportRow[] }) {
  // 1. A4 Print-to-PDF
  const handlePrintPdf = () => {
    window.print();
  };

  // 2. Download CSV / Excel (with Bengali UTF-8 BOM support)
  const handleDownloadCsv = () => {
    if (!rows.length) {
      toast.error("No stock records to export.");
      return;
    }

    const headers = [
      "ক্রমিক (SL)",
      "পণ্যের নাম (Product Name)",
      "বারকোড (Barcode)",
      "SKU",
      "ক্যাটাগরি (Category)",
      "ব্র্যান্ড (Brand)",
      "তাক/র্যাক (Shelf)",
      "মজুদ পরিমাণ (Quantity)",
      "একক (Unit)",
      "ক্রয় মূল্য (Purchase Price)",
      "বিক্রয় মূল্য (Selling Price)",
      "মোট ক্রয় মান (Total Cost)",
      "মোট বিক্রয় মান (Total Retail)",
      "মেয়াদ (Expiry Date)",
      "স্টক স্ট্যাটাস (Status)",
    ];

    const csvRows = rows.map((r, index) => [
      index + 1,
      `"${r.productName.replace(/"/g, '""')}"`,
      `"${r.barcode}"`,
      `"${r.sku}"`,
      `"${r.categoryName}"`,
      `"${r.brandName || "N/A"}"`,
      `"${r.sectionCode || "N/A"}"`,
      r.quantity,
      r.unitCode,
      r.purchasePrice.toFixed(2),
      r.sellingPrice.toFixed(2),
      r.totalCostValue.toFixed(2),
      r.totalRetailValue.toFixed(2),
      r.expiryDate ? new Date(r.expiryDate).toLocaleDateString() : "N/A",
      r.stockStatus,
    ]);

    // Prepend UTF-8 BOM (\uFEFF) so Excel opens Bengali characters properly
    const csvContent = "\uFEFF" + [headers.join(","), ...csvRows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `stock-valuation-report-${new Date().toISOString().split("T")[0]}.csv`;
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
        title="Download CSV for Excel"
      >
        <Download size={14} />
        <span>এক্সেল ডাউনলোড (Excel)</span>
      </button>

      <button
        onClick={handlePrintPdf}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 text-white rounded-xl transition shadow-xs cursor-pointer"
        title="Print Physical Stock Audit Sheet"
      >
        <Printer size={14} />
        <span>A4 অডিট প্রিন্ট (PDF)</span>
      </button>
    </div>
  );
}