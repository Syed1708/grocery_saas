"use client";

import { Filter, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterPill {
  label: string;
  value: string;
}

interface SearchFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  /** Optional filter pills rendered as a second row. */
  filters?: FilterPill[];
  activeFilter?: string;
  onFilterChange?: (value: string) => void;
  filterLabel?: string;
  /** Override the outer wrapper (e.g. for a compact bar). */
  className?: string;
}

export function SearchFilterBar({
  searchValue,
  onSearchChange,
  placeholder = "অনুসন্ধান করুন...",
  filters,
  activeFilter,
  onFilterChange,
  filterLabel = "ফিল্টার:",
  className,
}: SearchFilterBarProps) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl space-y-3 shadow-xs",
        className
      )}
    >
      <div className="relative">
        <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-neutral-900 dark:text-neutral-100 font-medium"
        />
      </div>

      {filters && filters.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1 shrink-0 mr-1">
            <Filter size={12} /> {filterLabel}
          </span>
          {filters.map((pill) => {
            const isActive = activeFilter === pill.value;
            return (
              <button
                key={pill.value}
                type="button"
                onClick={() => onFilterChange?.(pill.value)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-medium transition shrink-0 cursor-pointer",
                  isActive
                    ? "bg-blue-600 text-white font-semibold shadow-xs"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                )}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
