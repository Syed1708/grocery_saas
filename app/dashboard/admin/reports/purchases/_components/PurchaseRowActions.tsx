"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, FileText, CreditCard } from "lucide-react";
import { IPurchaseReportRow } from "@/types/purchases";

interface Props {
  row: IPurchaseReportRow;
  onViewDetails: (row: IPurchaseReportRow) => void;
}

export default function PurchaseRowActions({ row, onViewDetails }: Props) {
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
            <button
              onClick={() => {
                setOpen(false);
                onViewDetails(row);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer"
            >
              <FileText size={13} />
              <span>চালানের পণ্য বিবরণী</span>
            </button>

            {row.dueAmount > 0 && (
              <Link
                href={`/admin/purchases/payment?supplierId=${row.supplierId}&purchaseId=${row.id}`}
                className="flex items-center gap-2 px-3 py-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                onClick={() => setOpen(false)}
              >
                <CreditCard size={13} />
                <span>বকেয়া পরিশোধ করুন</span>
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}