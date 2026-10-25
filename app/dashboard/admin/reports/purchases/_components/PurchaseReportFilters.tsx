"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/common/ui/Input";
import { RotateCcw } from "lucide-react";

interface FilterProps {
  suppliers: { id: string; name: string; companyName: string | null }[];
}

export default function PurchaseReportFilters({ suppliers }: FilterProps) {
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
      {/* Quick Presets & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-neutral-500 mr-1">Presets:</span>
          <button type="button" onClick={() => handlePreset(0)} className="text-xs px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 rounded-md font-medium transition cursor-pointer">আজকে (Today)</button>
          <button type="button" onClick={() => handlePreset(1)} className="text-xs px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 rounded-md font-medium transition cursor-pointer">গতকাল (Yesterday)</button>
          <button type="button" onClick={() => handlePreset(7)} className="text-xs px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 rounded-md font-medium transition cursor-pointer">গত ৭ দিন (7 Days)</button>
          <button type="button" onClick={() => handlePreset(30)} className="text-xs px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 rounded-md font-medium transition cursor-pointer">চলতি মাস (This Month)</button>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 text-[11px] text-red-600 hover:underline cursor-pointer font-semibold"
          >
            <RotateCcw size={12} />
            <span>ফিল্টার মুছুন (Reset)</span>
          </button>
        )}
      </div>

      {/* Inputs */}
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
          value={searchParams.get("supplierId") || "all"}
          onChange={(e) => handleFilter("supplierId", e.target.value)}
          aria-label="Filter by supplier"
          className="text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 outline-none cursor-pointer"
        >
          <option value="all">সকল সাপ্লায়ার / কোম্পানি</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} {s.companyName ? `(${s.companyName})` : ""}
            </option>
          ))}
        </select>

        <select
          value={searchParams.get("paymentStatus") || "all"}
          onChange={(e) => handleFilter("paymentStatus", e.target.value)}
          aria-label="Filter by payment status"
          className="text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 outline-none cursor-pointer font-medium"
        >
          <option value="all">সকল পরিশোধের অবস্থা</option>
          <option value="PAID"> সম্পূর্ণ পরিশোধ (Paid)</option>
          <option value="PARTIAL"> আংশিক বাকি (Partial)</option>
          <option value="DUE"> বকেয়া / দেনা (Full Due)</option>
        </select>

        <Input
          placeholder="চালান নং বা সাপ্লায়ার..."
          defaultValue={searchParams.get("search") || ""}
          onChange={(e) => handleFilter("search", e.target.value)}
        />
      </div>
    </div>
  );
}