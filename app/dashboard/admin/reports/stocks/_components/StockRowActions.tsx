"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, ExternalLink, SlidersHorizontal, Barcode } from "lucide-react";
import { IStockReportRow } from "@/types/stock";

export default function StockRowActions({ row }: { row: IStockReportRow }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-500 transition cursor-pointer"
        title="More Actions"
      >
        <MoreHorizontal size={15} />
      </button>

      {open && (
        <>
          {/* Backdrop to close */}
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />

          <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg z-30 py-1 text-xs">
            {/* Quick Catalog Link */}
            <Link
              href={`/admin/products?search=${row.barcode}`}
              className="flex items-center gap-2 px-3 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              onClick={() => setOpen(false)}
            >
              <ExternalLink size={13} />
              <span>পণ্যের বিবরণ দেখুন</span>
            </Link>

            {/* Quick Stock Adjustment */}
            <Link
              href={`/admin/products/adjust?productId=${row.productId}`}
              className="flex items-center gap-2 px-3 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              onClick={() => setOpen(false)}
            >
              <SlidersHorizontal size={13} />
              <span>স্টক সমন্বয় / অপচয়</span>
            </Link>

            {/* Print Barcode Label */}
            <Link
              href={`/admin/products/barcode?barcode=${row.barcode}`}
              className="flex items-center gap-2 px-3 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              onClick={() => setOpen(false)}
            >
              <Barcode size={13} />
              <span>বারকোড লেবেল প্রিন্ট</span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}