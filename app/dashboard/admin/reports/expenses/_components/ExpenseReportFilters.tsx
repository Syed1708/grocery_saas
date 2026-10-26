"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/common/ui/Input";
import { RotateCcw } from "lucide-react";

interface FilterProps {
  categories: { id: string; name: string }[];
}

export default function ExpenseReportFilters({ categories }: FilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    const params = new URLSearchParams(searchParams.toString());
    params.set("startDate", start.toISOString().split("T")[0]);
    params.set("endDate", end.toISOString().split("T")[0]);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleReset = () => {
    router.push(pathname);
  };

  const hasActiveFilters = searchParams.toString().length > 0;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 rounded-xl space-y-2.5">
      {/* Quick Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-neutral-500 mr-1">Presets:</span>
          <button type="button" onClick={() => handlePreset(0)} className="text-xs px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 rounded-md font-medium transition cursor-pointer">আজকে</button>
          <button type="button" onClick={() => handlePreset(1)} className="text-xs px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 rounded-md font-medium transition cursor-pointer">গতকাল</button>
          <button type="button" onClick={() => handlePreset(7)} className="text-xs px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 rounded-md font-medium transition cursor-pointer">গত ৭ দিন</button>
          <button type="button" onClick={() => handlePreset(30)} className="text-xs px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 rounded-md font-medium transition cursor-pointer">চলতি মাস</button>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 text-[11px] text-red-600 hover:underline cursor-pointer font-semibold"
          >
            <RotateCcw size={12} />
            <span>ফিল্টার রিসেট</span>
          </button>
        )}
      </div>

      {/* Filter Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
        <Input
          type="date"
          value={searchParams.get("startDate") || ""}
          onChange={(e) => handleFilter("startDate", e.target.value)}
        />
        <Input
          type="date"
          value={searchParams.get("endDate") || ""}
          onChange={(e) => handleFilter("endDate", e.target.value)}
        />

        <select
          value={searchParams.get("categoryId") || "all"}
          onChange={(e) => handleFilter("categoryId", e.target.value)}
          aria-label="Filter by expense category"
          className="text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 outline-none cursor-pointer"
        >
          <option value="all">সকল খরচের খাত (All Categories)</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={searchParams.get("paymentMethod") || "all"}
          onChange={(e) => handleFilter("paymentMethod", e.target.value)}
          aria-label="Filter by payment method"
          className="text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 outline-none cursor-pointer font-medium"
        >
          <option value="all">সকল মাধ্যম (All Methods)</option>
          <option value="cash">নগদ ক্যাশ ড্রয়ার (Cash Drawer)</option>
          <option value="bank">ব্যাংক একাউন্ট (Bank Account)</option>
          <option value="bkash">বিকাশ (bKash)</option>
          <option value="nagad">নগদ (Nagad)</option>
        </select>

        <Input
          placeholder="ভাউচার বা রেফারেন্স..."
          defaultValue={searchParams.get("search") || ""}
          onChange={(e) => handleFilter("search", e.target.value)}
        />
      </div>
    </div>
  );
}