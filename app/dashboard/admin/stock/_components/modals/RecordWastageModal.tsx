"use client";
"use no memo";

import React, { useState, useRef, useMemo } from "react";
import { X, AlertOctagon, Save, Trash2, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { recordStockWastageAction } from "@/app/actions/stock-wastage-actions";
import { WastageReason } from "@/types/stock-wastage";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  products: any[];
  suppliers?: any[];
  currencySymbol?: string;
}

export default function RecordWastageModal({
  isOpen,
  onClose,
  products = [],
  suppliers = [],
  currencySymbol = "৳",
}: Props) {
  // 1. All useState & useRef hooks
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState<WastageReason>("ROTTEN_PERISHABLE");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<
    {
      rowId: string;
      productId: string;
      productName: string;
      barcode: string;
      availableStock: number;
      unitCode: string;
      quantity: number;
      unitCost: number;
      lineCost: number;
      reason: WastageReason;
    }[]
  >([]);

  // 2. All useMemo hooks (MUST BE CALLED BEFORE ANY `return null`!)
  const supplierKeyword = useMemo(() => {
    if (!selectedSupplierId) return "";
    const s = suppliers.find((x) => x.id === selectedSupplierId);
    return (s?.companyName || s?.name || "").split(/\s+/)[0]?.toLowerCase();
  }, [suppliers, selectedSupplierId]);

  const filteredSuggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q && !supplierKeyword) return [];

    return products
      .filter((p) => {
        if (supplierKeyword) {
          const brandMatches =
            p.brandName?.toLowerCase().includes(supplierKeyword) ||
            p.name?.toLowerCase().includes(supplierKeyword);
          if (!brandMatches) return false;
        }

        if (!q) return true;
        return (
          p.name?.toLowerCase().includes(q) ||
          p.barcode?.toLowerCase().includes(q) ||
          p.brandName?.toLowerCase().includes(q)
        );
      })
      .slice(0, 8);
  }, [products, search, supplierKeyword]);

  // 3. 🛡️ Early return is placed AFTER all hooks have executed
  if (!isOpen) return null;

  // 4. Handlers
  const addItem = (p: any) => {
    const cost = Number(p.costPrice || 0);
    const stock = Number(p.stockQuantity || 0);

    if (stock <= 0) {
      toast.warning(`"${p.name}" এর বর্তমান স্টক ০! নষ্ট হিসেবে লেখা সম্ভব নয়।`);
      return;
    }

    setItems((prev) => {
      const idx = prev.findIndex((i) => i.productId === p.id);
      if (idx > -1) {
        const next = [...prev];
        const newQty = next[idx].quantity + 1;
        if (newQty > stock) {
          toast.warning(`স্টকের বেশি নষ্ট দেখানো যাবে না! বর্তমান স্টক: ${stock}`);
          return prev;
        }
        next[idx].quantity = newQty;
        next[idx].lineCost = newQty * cost;
        return next;
      }
      return [
        ...prev,
        {
          rowId: `row-${Date.now()}-${Math.random()}`,
          productId: p.id,
          productName: p.name,
          barcode: p.barcode || "",
          availableStock: stock,
          unitCode: p.unitCode || "pcs",
          quantity: 1,
          unitCost: cost,
          lineCost: cost,
          reason,
        },
      ];
    });

    setSearch("");
    setShowDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredSuggestions.length > 0) {
        addItem(filteredSuggestions[0]);
      } else {
        toast.error(`"${search}" নামে কোনো পণ্য পাওয়া যায়নি।`);
      }
    }
  };

  const updateItemQty = (rowId: string, qty: number) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.rowId !== rowId) return i;
        const validQty = Math.min(i.availableStock, Math.max(1, qty));
        return {
          ...i,
          quantity: validQty,
          lineCost: validQty * i.unitCost,
        };
      })
    );
  };

  const removeItem = (rowId: string) => {
    setItems((prev) => prev.filter((i) => i.rowId !== rowId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return toast.error("কমপক্ষে একটি নষ্ট পণ্য যুক্ত করুন।");

    setLoading(true);
    const res = await recordStockWastageAction({
      reason,
      notes,
      items: items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitCost: i.unitCost,
        reason: i.reason,
      })),
    });
    setLoading(false);

    if (res.success) {
      toast.success(`নষ্ট মাল ভাউচার #${res.wastageNo} সফলভাবে রেকর্ড সম্পন্ন!`);
      onClose();
    } else {
      toast.error(res.error || "সংরক্ষণ ব্যর্থ হয়েছে।");
    }
  };

  const totalCost = items.reduce((sum, i) => sum + i.lineCost, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <AlertOctagon className="text-red-500" size={18} />
              নষ্ট / ক্ষতিগ্রস্থ মাল এন্ট্রি (Stock Spoilage)
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              পণ্য সিলেক্ট করুন (ক্যাশ ড্রয়ার অপরিবর্তিত থাকবে, স্টক কমে ক্ষতি হিসেবে রেকর্ড হবে)
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-neutral-400 rounded-xl">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Reason & Supplier Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">নষ্টের প্রধান কারণ:</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as any)}
                className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-800 border rounded-xl text-xs font-medium"
              >
                <option value="ROTTEN_PERISHABLE">পচে নষ্ট (ফলমূল, শাকসবজি)</option>
                <option value="BROKEN_DAMAGED">ভেঙে নষ্ট (বোতল, প্যাকেট লিক)</option>
                <option value="EXPIRED_NO_RETURN">মেয়াদোত্তীর্ণ (কোম্পানি ফেরত নেয় না)</option>
                <option value="PEST_DAMAGE">ইঁদুর বা পোকামাকড়ের ক্ষতি</option>
                <option value="INTERNAL_STORE_USE">দোকানের নিজস্ব ব্যবহার</option>
                <option value="OTHER">অন্যান্য</option>
              </select>
            </div>

            <div>
              <label className=" text-xs font-semibold mb-1 flex items-center gap-1">
                <Filter size={12} className="text-neutral-400" />
                কোম্পানি / সরবরাহকারী ফিল্টার (ঐচ্ছিক):
              </label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-800 border rounded-xl text-xs font-medium"
              >
                <option value="">-- সকল কোম্পানির পণ্য --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.companyName || s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Live Product Search with Autocomplete Dropdown */}
          <div className="relative">
            <label className="block text-xs font-semibold mb-1">পণ্য খুঁজুন বা বারকোড স্ক্যান করুন:</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-neutral-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                onKeyDown={handleKeyDown}
                placeholder="পণ্যের নাম, বারকোড বা ব্র্যান্ড লিখে খুঁজুন..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Suggestions Dropdown */}
            {showDropdown && filteredSuggestions.length > 0 && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowDropdown(false)} />
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-xl z-40 max-h-56 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-700">
                  {filteredSuggestions.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => addItem(p)}
                      className="p-3 text-xs flex justify-between items-center hover:bg-neutral-50 dark:hover:bg-neutral-700/60 cursor-pointer transition"
                    >
                      <div>
                        <strong className="text-neutral-900 dark:text-neutral-100 block">{p.name}</strong>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {p.barcode ? `বারকোড: ${p.barcode} | ` : ""}
                          {p.brandName ? `ব্র্যান্ড: ${p.brandName}` : ""}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-red-600 block">
                          দর: {currencySymbol}{p.costPrice.toFixed(2)}
                        </span>
                        <span
                          className={`text-[10px] font-semibold ${
                            p.stockQuantity > 0 ? "text-emerald-600" : "text-red-500"
                          }`}
                        >
                          স্টক: {p.stockQuantity} {p.unitCode}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Selected Items List */}
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800">
            {items.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400">
                কোন পণ্য যুক্ত করা হয়নি। উপরে টাইপ করে পণ্য নির্বাচন করুন।
              </div>
            ) : (
              items.map((item) => (
                <div key={item.rowId} className="p-3 text-xs flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold block truncate">{item.productName}</span>
                    <span className="text-[11px] text-neutral-400 font-mono">
                      স্টক: {item.availableStock} {item.unitCode} | ক্রয়মূল্য: {currencySymbol}
                      {item.unitCost.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        max={item.availableStock}
                        value={item.quantity}
                        onChange={(e) => updateItemQty(item.rowId, parseFloat(e.target.value) || 1)}
                        className="w-16 p-1 text-center font-mono font-bold border rounded-lg bg-white dark:bg-neutral-800 text-xs"
                      />
                      <span className="text-[10px] text-neutral-400">{item.unitCode}</span>
                    </div>

                    <span className="font-mono font-bold text-red-600 w-20 text-right">
                      {currencySymbol}{item.lineCost.toFixed(2)}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeItem(item.rowId)}
                      className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">অতিরিক্ত নোট (ঐচ্ছিক):</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="কী কারণে নষ্ট হয়েছে লিখুন..."
              className="w-full p-2 text-xs border rounded-xl bg-white dark:bg-neutral-800 outline-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 border-t flex justify-between items-center">
          <div className="text-xs font-mono font-bold text-red-600">
            মোট আর্থিক ক্ষতি: {currencySymbol}{totalCost.toFixed(2)}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-xl text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
              বাতিল
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || items.length === 0}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition"
            >
              <Save size={14} /> {loading ? "রেকর্ড হচ্ছে..." : "নষ্ট মাল নিশ্চিত করুন"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}