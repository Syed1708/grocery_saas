"use client";

import { useMemo } from "react";
import { PosProduct } from "./usePosCart";
import { toast } from "sonner";

interface PosCatalogProps {
  products: PosProduct[];
  categories: any[];
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onBarcodeSubmit: (e: React.FormEvent) => void;
  barcodeInputRef: React.RefObject<HTMLInputElement | null>;
  onAddToCart: (p: PosProduct) => void;
  cartProductIds: string[];
  currencySymbol?: string;
}

export default function PosCatalog({
  products,
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onBarcodeSubmit,
  barcodeInputRef,
  onAddToCart,
  cartProductIds,
  currencySymbol = "৳",
}: PosCatalogProps) {
  // Filter catalog
  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== "all" && p.categoryId !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.barcode.toLowerCase() === q ||
          p.name.toLowerCase().includes(q) ||
          (p.nameEn && p.nameEn.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <div className="flex-1 flex flex-col p-3 gap-2.5 overflow-hidden border-r border-neutral-200 dark:border-neutral-800">
      {/* 1. Barcode Scanner Gun Input */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-2 shadow-xs">
        <form onSubmit={onBarcodeSubmit} className="flex items-center gap-2">
          <span className="text-xl">📷</span>
          <input
            ref={barcodeInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="স্ক্যানার গান দিয়ে বারকোড স্ক্যান করুন অথবা পণ্যের নাম লিখুন... (Press '/' to focus)"
            className="flex-1 px-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </form>
      </div>

      {/* 2. Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0">
        <button
          type="button"
          onClick={() => onSelectCategory("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            selectedCategory === "all"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200"
          }`}
        >
          🌟 সকল পণ্য ({products.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedCategory === cat.id
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* 3. Three-Column Product Grid */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
          {filtered.map((product) => {
            const availableStock = Number(product.stockAvailable ?? 0);
            const isOutOfStock = availableStock <= 0;
            const isLowStock = availableStock <= (product.alertQuantity || 5);
            const inCart = cartProductIds.includes(product.id);

            return (
              <div
                key={product.id}
                onClick={() => {
                  if (isOutOfStock) {
                    toast.error(`"${product.name}" এই শাখায় স্টক নেই!`);
                    return;
                  }
                  onAddToCart(product);
                }}
                className={`border rounded-xl p-2.5 flex flex-col justify-between transition shadow-xs relative select-none ${
                  isOutOfStock
                    ? "opacity-45 bg-neutral-100 dark:bg-neutral-850 border-dashed border-neutral-300 dark:border-neutral-700 cursor-not-allowed"
                    : inCart
                    ? "border-blue-500 ring-2 ring-blue-500/10 bg-blue-50/20 dark:bg-blue-950/20 cursor-pointer"
                    : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-blue-500 cursor-pointer"
                }`}
              >
                {/* Header: Category Pill & Stock Badge */}
                <div className="flex justify-between items-start gap-1 mb-1.5">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 truncate max-w-22.5">
                    {product.categoryName}
                  </span>

                  {/* Dynamic Stock Badge */}
                  <span
                    className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded ${
                      isOutOfStock
                        ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 font-black"
                        : isLowStock
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                    }`}
                  >
                    {isOutOfStock ? "স্টক নেই" : `${availableStock} ${product.unitCode}`}
                  </span>
                </div>

                {/* Product Title */}
                <div
                  className="font-bold text-xs text-neutral-900 dark:text-neutral-100 line-clamp-2 my-1"
                  title={product.name}
                >
                  {product.name}
                </div>

                {/* Price & Action Button */}
                <div className="flex justify-between items-end mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <div>
                    <span className="text-[9px] text-neutral-400 uppercase font-bold block">MRP / রেট</span>
                    <span className="font-black text-sm text-blue-600 dark:text-blue-400 font-mono">
                      {currencySymbol}{product.unitPrice.toFixed(2)}
                    </span>
                  </div>

                  {isOutOfStock ? (
                    <span className="text-[9px] font-bold text-red-500 bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded-md">
                      অনুপলব্ধ
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                      + Add
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}