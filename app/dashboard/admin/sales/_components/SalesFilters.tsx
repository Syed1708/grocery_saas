"use client";

import { Search, Filter, X } from "lucide-react";

interface SalesFiltersProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  methodFilter: string;
  onMethodChange: (val: string) => void;
  onReset: () => void;
  totalFilteredCount: number;
}

export default function SalesFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  methodFilter,
  onMethodChange,
  onReset,
  totalFilteredCount,
}: SalesFiltersProps) {
  const isFiltered = searchQuery !== "" || statusFilter !== "all" || methodFilter !== "all";

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3.5 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ইনভয়েস নং, কাস্টমারের নাম বা ফোন নম্বর দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Status Select */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-bold text-neutral-400">পেমেন্ট:</span>
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none font-semibold cursor-pointer"
            >
              <option value="all">সব অবস্থা (All)</option>
              <option value="paid">পরিশোধিত (Paid)</option>
              <option value="partial">আংশিক (Partial)</option>
              <option value="due">বাকি (Due)</option>
            </select>
          </div>

          {/* Payment Method Select */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-bold text-neutral-400">মাধ্যম:</span>
            <select
              value={methodFilter}
              onChange={(e) => onMethodChange(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none font-semibold cursor-pointer"
            >
              <option value="all">সব মাধ্যম (All)</option>
              <option value="cash">নগদ (Cash)</option>
              <option value="bkash">বিকাশ (bKash)</option>
              <option value="bank">ব্যাংক (Bank)</option>
              <option value="due">বাকি (Due)</option>
              <option value="mixed">মিক্সড (Mixed)</option>
            </select>
          </div>

          {/* Clear Filter Button */}
          {isFiltered && (
            <button
              type="button"
              onClick={onReset}
              className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl hover:bg-rose-100 transition flex items-center gap-1 cursor-pointer"
            >
              <X size={13} /> রিসেট
            </button>
          )}
        </div>
      </div>

      {/* Result Counter */}
      <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-neutral-100 dark:border-neutral-800">
        <span className="flex items-center gap-1.5 font-medium">
          <Filter size={12} className="text-neutral-400" />
          ফিল্টার অনুযায়ী ফলাফল: <strong className="text-neutral-700 dark:text-neutral-200">{totalFilteredCount}</strong> টি ইনভয়েস
        </span>
      </div>
    </div>
  );
}