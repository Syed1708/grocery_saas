"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/common/ui/Input";
import { RotateCcw } from "lucide-react";

export default function ProfitLossFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePreset = (type: "today" | "yesterday" | "last7" | "thisMonth" | "lastMonth") => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (type === "today") {
      // start and end are today
    } else if (type === "yesterday") {
      start.setDate(now.getDate() - 1);
      end.setDate(now.getDate() - 1);
    } else if (type === "last7") {
      start.setDate(now.getDate() - 7);
    } else if (type === "thisMonth") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (type === "lastMonth") {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    }

    const params = new URLSearchParams();
    params.set("startDate", start.toISOString().split("T")[0]);
    params.set("endDate", end.toISOString().split("T")[0]);
    router.push(`${pathname}?${params.toString()}`);
  };

  const hasActiveFilters = searchParams.toString().length > 0;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 rounded-xl space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-neutral-500 mr-1">সময়কাল (Period):</span>
          <button type="button" onClick={() => handlePreset("today")} className="text-xs px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 rounded-md font-medium transition cursor-pointer">আজকে</button>
          <button type="button" onClick={() => handlePreset("yesterday")} className="text-xs px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 rounded-md font-medium transition cursor-pointer">গতকাল</button>
          <button type="button" onClick={() => handlePreset("last7")} className="text-xs px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 rounded-md font-medium transition cursor-pointer">গত ৭ দিন</button>
          <button type="button" onClick={() => handlePreset("thisMonth")} className="text-xs px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 rounded-md font-medium transition cursor-pointer">চলতি মাস</button>
          <button type="button" onClick={() => handlePreset("lastMonth")} className="text-xs px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 rounded-md font-medium transition cursor-pointer">গত মাস</button>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => router.push(pathname)}
            className="flex items-center gap-1 text-[11px] text-red-600 hover:underline cursor-pointer font-semibold"
          >
            <RotateCcw size={12} />
            <span>রিসেট (Reset)</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
        <Input
          label="হতে (From Date)"
          type="date"
          value={searchParams.get("startDate") || ""}
          onChange={(e) => handleFilter("startDate", e.target.value)}
        />
        <Input
          label="পর্যন্ত (To Date)"
          type="date"
          value={searchParams.get("endDate") || ""}
          onChange={(e) => handleFilter("endDate", e.target.value)}
        />
      </div>
    </div>
  );
}