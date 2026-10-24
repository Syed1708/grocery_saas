"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/common/ui/Input";

export function SalesReportFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
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

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 rounded-xl space-y-3">
      {/* Quick Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-neutral-500 mr-1">Presets:</span>
          <button onClick={() => handlePreset(0)} className="text-xs px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 rounded-md font-medium transition cursor-pointer">Today</button>
          <button onClick={() => handlePreset(1)} className="text-xs px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 rounded-md font-medium transition cursor-pointer">Yesterday</button>
          <button onClick={() => handlePreset(7)} className="text-xs px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 rounded-md font-medium transition cursor-pointer">Last 7 Days</button>
          <button onClick={() => handlePreset(30)} className="text-xs px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 rounded-md font-medium transition cursor-pointer">This Month</button>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
        <Input
          type="date"
          value={searchParams.get("startDate") || ""}
          onChange={(e) => setFilter("startDate", e.target.value)}
        />
        <Input
          type="date"
          value={searchParams.get("endDate") || ""}
          onChange={(e) => setFilter("endDate", e.target.value)}
        />
        <select
          value={searchParams.get("paymentMethod") || "all"}
          onChange={(e) => setFilter("paymentMethod", e.target.value)}
          aria-label="Filter by payment method"
          className="text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 outline-none"
        >
          <option value="all">All Payment Methods</option>
          <option value="cash">Cash</option>
          <option value="bkash">bKash</option>
          <option value="nagad">Nagad</option>
          <option value="bank">Bank</option>
          <option value="card">Card</option>
          <option value="due">Due (Khata)</option>
        </select>
        <div className="relative">
          <Input
            placeholder="Search invoice or customer..."
            defaultValue={searchParams.get("search") || ""}
            onChange={(e) => setFilter("search", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}