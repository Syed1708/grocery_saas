"use client";

import { useMemo } from "react";
import { Search } from "lucide-react";

interface Props {
  suppliers: any[];
  selectedSupplierId: string;
  onSelectSupplier: (s: any) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  showDropdown: boolean;
  setShowDropdown: (show: boolean) => void;
  currencySymbol?: string;
}

export default function SupplierPicker({
  suppliers,
  selectedSupplierId,
  onSelectSupplier,
  searchQuery,
  onSearchChange,
  showDropdown,
  setShowDropdown,
  currencySymbol = "৳",
}: Props) {
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.companyName?.toLowerCase().includes(q) ||
        s.phone?.includes(q)
    );
  }, [suppliers, searchQuery]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Live Search */}
      <div className="relative">
        <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
          🔍 পদ্ধতি ১: নাম বা ফোন নম্বর দিয়ে খুঁজুন
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-neutral-400" size={15} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="সাপ্লায়ার বা কোম্পানির নাম..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {showDropdown && filtered.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-700">
            {filtered.map((s) => (
              <div
                key={s.id}
                onClick={() => onSelectSupplier(s)}
                className="p-3 text-xs flex justify-between items-center hover:bg-neutral-50 dark:hover:bg-neutral-700/60 cursor-pointer"
              >
                <div>
                  <strong className="text-neutral-900 dark:text-neutral-100 block">{s.name}</strong>
                  <span className="text-[11px] text-neutral-500">{s.companyName || "Vendor"} • {s.phone}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  Number(s.currentDue || 0) > 0
                    ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                }`}>
                  বাকি: {currencySymbol}{Number(s.currentDue || 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dropdown Select */}
      <div>
        <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
          📋 পদ্ধতি ২: সরাসরি ড্রপডাউন থেকে নির্বাচন করুন <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedSupplierId}
          onChange={(e) => {
            const found = suppliers.find((s) => s.id === e.target.value);
            if (found) onSelectSupplier(found);
          }}
          required
          className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="">-- তালিকা থেকে নির্বাচন করুন --</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.companyName || "Vendor"}) - পূর্বের বাকি: {currencySymbol}
              {Number(s.currentDue || 0).toFixed(2)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}