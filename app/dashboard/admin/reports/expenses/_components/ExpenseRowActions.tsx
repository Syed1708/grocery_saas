"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, FileText, Image as ImageIcon } from "lucide-react";
import { IExpenseReportRow } from "@/types/expenses";

export default function ExpenseRowActions({ row }: { row: IExpenseReportRow }) {
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
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg z-30 py-1 text-xs">
            <Link
              href={`/admin/expenses?voucher=${row.voucherNo}`}
              className="flex items-center gap-2 px-3 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              onClick={() => setOpen(false)}
            >
              <FileText size={13} />
              <span>ভাউচার হিস্ট্রি দেখুন</span>
            </Link>

            {row.receiptImage && (
              <a
                href={row.receiptImage}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                onClick={() => setOpen(false)}
              >
                <ImageIcon size={13} />
                <span>বিল স্লিপ ছবি দেখুন</span>
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
}