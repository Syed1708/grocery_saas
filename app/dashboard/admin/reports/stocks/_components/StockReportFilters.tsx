"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {  RotateCcw } from "lucide-react";
import { Input } from "@/components/common/ui/Input";

interface FilterProps {
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
  sections: { id: string; name: string; code: string | null }[];
}

export default function StockReportFilters({ categories, brands, sections }: FilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleReset = () => {
    router.push(pathname);
  };

  const hasActiveFilters = searchParams.toString().length > 0;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 rounded-xl space-y-2.5">
      <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
        <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
          ফিল্টার প্যানেল (Stock Filters)
        </span>
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-[11px] text-red-600 hover:underline cursor-pointer font-semibold"
          >
            <RotateCcw size={12} />
            <span>ফিল্টার রিসেট করুন</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
        <div className="relative">
          <Input
            placeholder="পণ্য, বারকোড বা SKU..."
            defaultValue={searchParams.get("search") || ""}
            onChange={(e) => handleFilter("search", e.target.value)}
          />
        </div>

        <select
          value={searchParams.get("categoryId") || "all"}
          onChange={(e) => handleFilter("categoryId", e.target.value)}
          aria-label="Filter by category"
          className="text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 outline-none cursor-pointer"
        >
          <option value="all">সকল ক্যাটাগরি</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={searchParams.get("brandId") || "all"}
          onChange={(e) => handleFilter("brandId", e.target.value)}
          aria-label="Filter by brand"
          className="text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 outline-none cursor-pointer"
        >
          <option value="all">সকল ব্র্যান্ড</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        <select
          value={searchParams.get("sectionId") || "all"}
          onChange={(e) => handleFilter("sectionId", e.target.value)}
          aria-label="Filter by shelf or rack"
          className="text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 outline-none cursor-pointer"
        >
          <option value="all">সকল তাক ও র্যাক</option>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>{s.name} ({s.code || "N/A"})</option>
          ))}
        </select>

        <select
          value={searchParams.get("stockStatus") || "all"}
          onChange={(e) => handleFilter("stockStatus", e.target.value)}
          aria-label="Filter by stock status"
          className="text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 outline-none cursor-pointer font-semibold text-neutral-700 dark:text-neutral-300"
        >
          <option value="all">সকল স্টক লেভেল</option>
          <option value="LOW_STOCK">⚠️ লো স্টক অ্যালার্ট</option>
          <option value="OUT_OF_STOCK">🛑 স্টক শেষ</option>
          <option value="IN_STOCK">পর্যাপ্ত মজুদ</option>
        </select>
      </div>
    </div>
  );
}