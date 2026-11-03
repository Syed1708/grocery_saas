"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Phone } from "lucide-react";
import { IPosCustomer } from "@/types/sale";

interface PosTopBarProps {
  branchName: string;
  cashierName: string;
  customers: IPosCustomer[];
  selectedCustomerId: string;
  onCustomerChange: (id: string) => void;
  selectedCustomer: IPosCustomer | null;
  onOpenQuickCustomer: () => void;
  currencySymbol?: string;
}

export default function PosTopBar({
  branchName,
  cashierName,
  customers,
  selectedCustomerId,
  onCustomerChange,
  selectedCustomer,
  onOpenQuickCustomer,
  currencySymbol = "৳",
}: PosTopBarProps) {
  const [searchVal, setSearchVal] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = searchVal.trim()
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(searchVal.toLowerCase()) ||
          (c.phone && c.phone.includes(searchVal))
      ).slice(0, 8)
    : [];

  return (
    <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 p-3 shadow-xs shrink-0">
      <div className="flex flex-col gap-2.5">
        <div className="flex justify-between items-center pb-2 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition cursor-pointer"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="flex items-center gap-1.5">
                <strong className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{branchName}</strong>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">● অনলাইন</span>
              </div>
              <span className="text-[11px] text-neutral-400">ক্যাশিয়ার: {cashierName}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 border dark:border-neutral-700">[F2] বিক্রয় সম্পন্ন</span>
            <span className="font-mono text-[10px] font-bold px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 border dark:border-neutral-700">[/] স্ক্যান</span>
          </div>
        </div>

        <div className="flex items-center gap-2 relative">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchVal}
              onChange={(e) => {
                setSearchVal(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="🔍 কাস্টমার নাম বা মোবাইল নম্বর লিখুন..."
              className="w-full px-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border dark:border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
            {showSuggestions && suggestions.length > 0 && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowSuggestions(false)} />
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-900 border dark:border-neutral-800 rounded-xl shadow-xl z-40 max-h-56 overflow-y-auto divide-y dark:divide-neutral-800">
                  {suggestions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        onCustomerChange(c.id);
                        setSearchVal(`${c.name} (${c.phone || "No Phone"})`);
                        setShowSuggestions(false);
                      }}
                      className="w-full p-2.5 text-left text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 flex justify-between items-center cursor-pointer"
                    >
                      <div>
                        <span className="font-bold text-neutral-900 dark:text-neutral-100 block">{c.name}</span>
                        <span className="text-[11px] text-neutral-400 flex items-center gap-1"><Phone size={10} /> {c.phone || "No Phone"}</span>
                      </div>
                      {c.currentDue > 0 && (
                        <span className="text-[11px] font-bold text-red-600 bg-red-50 dark:bg-red-950 px-2 py-0.5 rounded">
                          বাকি: {currencySymbol}{c.currentDue.toFixed(2)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="w-64 sm:w-72">
            <select
              value={selectedCustomerId}
              onChange={(e) => onCustomerChange(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border dark:border-neutral-700 rounded-lg outline-none cursor-pointer font-medium"
            >
              <option value="">খুচরা ক্রেতা (Walk-in Counter)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.phone || "No Phone"})</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onOpenQuickCustomer}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition shrink-0 cursor-pointer"
          >
            + কাস্টমার
          </button>

          {selectedCustomer && selectedCustomer.currentDue > 0 && (
            <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0">
              <span>পূর্বের বাকি:</span>
              <span className="font-mono text-sm">{currencySymbol}{selectedCustomer.currentDue.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}