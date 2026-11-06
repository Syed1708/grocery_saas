"use client";

import { Search, Filter, X } from "lucide-react";
import { ExtraOption } from "./ProductsClient";
import { ICategoryOption } from "@/types";

export type StockStatusFilter = "ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

interface ProductFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (c: string) => void;
  selectedBrand: string;
  onBrandChange: (b: string) => void;
  selectedSection: string;
  onSectionChange: (s: string) => void;
  stockStatus: StockStatusFilter;
  onStockStatusChange: (status: StockStatusFilter) => void;
  categories: ICategoryOption[];
  brands: ExtraOption[];
  sections: ExtraOption[];
  onReset: () => void;
  isFiltered: boolean;
}

export default function ProductFilterBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedBrand,
  onBrandChange,
  selectedSection,
  onSectionChange,
  stockStatus,
  onStockStatusChange,
  categories = [],
  brands = [],
  sections = [],
  onReset,
  isFiltered,
}: ProductFilterBarProps) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl space-y-3.5 shadow-xs">
      {/* Search & Dropdown Filters Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-neutral-400" size={15} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="নাম, বারকোড বা SKU দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-neutral-900 dark:text-neutral-100"
          />
        </div>

        {/* Category Select */}
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="text-xs px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium"
        >
          <option value="">সকল ক্যাটাগরি (All Categories)</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Brand Select */}
        <select
          value={selectedBrand}
          onChange={(e) => onBrandChange(e.target.value)}
          className="text-xs px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium"
        >
          <option value="">সকল ব্র্যান্ড / কোম্পানি (All Brands)</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} {b.companyName ? `(${b.companyName})` : ""}
            </option>
          ))}
        </select>

        {/* Shelf / Section Select */}
        <select
          value={selectedSection}
          onChange={(e) => onSectionChange(e.target.value)}
          className="text-xs px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium"
        >
          <option value="">সকল তাক ও র্যাক (All Shelves)</option>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} {s.code ? `[${s.code}]` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Stock Status Pills & Reset Button Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1 shrink-0 mr-1">
            <Filter size={12} /> স্ট্যাটাস:
          </span>
          {[
            { label: "সব পণ্য", value: "ALL" },
            { label: "মজুদ আছে (In Stock)", value: "IN_STOCK" },
            { label: "লো স্টক (Low Stock)", value: "LOW_STOCK" },
            { label: "স্টক আউট (Out of Stock)", value: "OUT_OF_STOCK" },
          ].map((pill) => {
            const isActive = stockStatus === pill.value;
            return (
              <button
                key={pill.value}
                type="button"
                onClick={() => onStockStatusChange(pill.value as StockStatusFilter)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white font-semibold shadow-xs"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        {isFiltered && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl hover:bg-rose-100 transition cursor-pointer self-start sm:self-auto"
          >
            <X size={13} /> ফিল্টার রিসেট করুন
          </button>
        )}
      </div>
    </div>
  );
}