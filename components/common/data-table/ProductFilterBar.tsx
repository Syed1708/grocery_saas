"use client";

import { Search, X, Filter } from "lucide-react";

export type StockStatusFilter = "ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

interface FilterOption {
  id: string;
  name: string;
}

interface ProductFilterBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedCategory: string;
  onCategoryChange: (id: string) => void;
  selectedBrand: string;
  onBrandChange: (id: string) => void;
  selectedSection: string;
  onSectionChange: (id: string) => void;
  stockStatus: StockStatusFilter;
  onStockStatusChange: (status: StockStatusFilter) => void;
  categories: FilterOption[];
  brands: FilterOption[];
  sections: FilterOption[];
  onReset: () => void;
  isFiltered: boolean;
}

export function ProductFilterBar({
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
  categories,
  brands,
  sections,
  onReset,
  isFiltered,
}: ProductFilterBarProps) {
  const statusPills: { label: string; value: StockStatusFilter }[] = [
    { label: "All Items", value: "ALL" },
    { label: "In Stock", value: "IN_STOCK" },
    { label: "Low Stock Alert", value: "LOW_STOCK" },
    { label: "Out of Stock", value: "OUT_OF_STOCK" },
  ];

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl space-y-3 shadow-xs">
      {/* Row 1: Search + Category + Brand + Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, English name, or scan barcode..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-neutral-900 dark:text-neutral-100"
          />
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-800 dark:text-neutral-200 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Brand Filter */}
        <select
          value={selectedBrand}
          onChange={(e) => onBrandChange(e.target.value)}
          className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-800 dark:text-neutral-200 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="">All Brands / Co.</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        {/* Section / Shelf Filter */}
        <div className="flex items-center gap-2">
          <select
            value={selectedSection}
            onChange={(e) => onSectionChange(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-800 dark:text-neutral-200 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">All Shelves / তাক</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {isFiltered && (
            <button
              type="button"
              onClick={onReset}
              className="px-2.5 py-2 text-neutral-500 hover:text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition cursor-pointer shrink-0"
              title="Reset All Filters"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Stock Status Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pt-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1 shrink-0 mr-1">
          <Filter size={12} /> Stock Status:
        </span>
        {statusPills.map((pill) => {
          const isActive = stockStatus === pill.value;
          return (
            <button
              key={pill.value}
              type="button"
              onClick={() => onStockStatusChange(pill.value)}
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
    </div>
  );
}