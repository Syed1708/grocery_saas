"use client";
"use no memo";

import React, { useState, useRef, useMemo } from "react";
import { X, ArrowLeftRight, Save, Trash2, Search, Truck } from "lucide-react";
import { toast } from "sonner";
import { createAndDispatchTransferAction } from "@/app/actions/stock-transfer-actions";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  branches: any[];
  currentBranchId: string;
  products: any[];
  currencySymbol?: string;
}

export default function CreateTransferModal({
  isOpen,
  onClose,
  branches = [],
  currentBranchId,
  products = [],
  currencySymbol = "৳",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [toBranchId, setToBranchId] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
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
    }[]
  >([]);

  // Other branches excluding the active branch
  const availableDestinationBranches = useMemo(
    () => branches.filter((b) => b.id !== currentBranchId),
    [branches, currentBranchId]
  );

  const filteredSuggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((p) => p.name?.toLowerCase().includes(q) || p.barcode?.toLowerCase().includes(q))
      .slice(0, 8);
  }, [products, search]);

  if (!isOpen) return null;

  const addItem = (p: any) => {
    const cost = Number(p.costPrice || 0);
    const stock = Number(p.stockQuantity || 0);

    if (stock <= 0) {
      toast.warning(`"${p.name}" এর পর্যাপ্ত স্টক নেই!`);
      return;
    }

    setItems((prev) => {
      const idx = prev.findIndex((i) => i.productId === p.id);
      if (idx > -1) {
        const next = [...prev];
        const newQty = next[idx].quantity + 1;
        if (newQty > stock) {
          toast.warning(`স্টকের বেশি পাঠানো যাবে না! বর্তমান স্টক: ${stock}`);
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
        },
      ];
    });

    setSearch("");
    setShowDropdown(false);
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
    if (!toBranchId) return toast.error("অনুগ্রহ করে গন্তব্য ব্রাঞ্চ নির্বাচন করুন।");
    if (items.length === 0) return toast.error("কমপক্ষে একটি পণ্য স্থানান্তর তালিকায় যোগ করুন।");

    setLoading(true);
    const res = await createAndDispatchTransferAction({
      toBranchId,
      driverName,
      driverPhone,
      vehicleNo,
      notes,
      items: items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitCost: i.unitCost,
      })),
    });
    setLoading(false);

    if (res.success) {
      toast.success(`স্থানান্তর চালান #${res.transferNo} সফলভাবে প্রেরণ করা হয়েছে!`);
      onClose();
    } else {
      toast.error(res.error || "স্থানান্তর ব্যর্থ হয়েছে।");
    }
  };

  const totalCost = items.reduce((sum, i) => sum + i.lineCost, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-5 border-b flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <ArrowLeftRight className="text-blue-600" size={18} />
              নতুন ব্রাঞ্চ স্টক স্থানান্তর (Dispatch Transfer)
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              অন্য ব্রাঞ্চে পণ্য পাঠান (বর্তমান ব্রাঞ্চের স্টক কমে রাস্তায়/ট্রানজিটে থাকবে)
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-neutral-400 rounded-xl">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Destination Branch Picker */}
          <div>
            <label className="block text-xs font-semibold mb-1">
              গন্তব্য ব্রাঞ্চ নির্বাচন করুন <span className="text-red-500">*</span>:
            </label>
            <select
              value={toBranchId}
              required
              onChange={(e) => setToBranchId(e.target.value)}
              className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-800 border rounded-xl text-xs font-semibold"
            >
              <option value="">-- যে ব্রাঞ্চে পাঠাতে চান তা সিলেক্ট করুন --</option>
              {availableDestinationBranches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} {b.isMain ? "(মেইন ওয়্যারহাউস)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Driver & Transport Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <div>
              <label className="block text-[11px] font-medium text-neutral-500 mb-1">ড্রাইভার / প্রতিনিধি:</label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="নাম লিখুন..."
                className="w-full p-1.5 text-xs border rounded-lg bg-white dark:bg-neutral-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-neutral-500 mb-1">ড্রাইভার মোবাইল:</label>
              <input
                type="text"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                placeholder="017xxxxxxxx"
                className="w-full p-1.5 text-xs border rounded-lg bg-white dark:bg-neutral-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-neutral-500 mb-1">গাড়ি / ভ্যান নম্বর:</label>
              <input
                type="text"
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value)}
                placeholder="ঢাকা মেট্রো-..."
                className="w-full p-1.5 text-xs border rounded-lg bg-white dark:bg-neutral-800"
              />
            </div>
          </div>

          {/* Product Search & Dropdown */}
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
                placeholder="পণ্যের নাম বা বারকোড লিখে খুঁজুন..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {showDropdown && filteredSuggestions.length > 0 && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowDropdown(false)} />
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-800 border rounded-2xl shadow-xl z-40 max-h-56 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-700">
                  {filteredSuggestions.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => addItem(p)}
                      className="p-3 text-xs flex justify-between items-center hover:bg-neutral-50 dark:hover:bg-neutral-700/60 cursor-pointer"
                    >
                      <div>
                        <strong className="text-neutral-900 dark:text-neutral-100 block">{p.name}</strong>
                        <span className="text-[10px] text-neutral-400 font-mono">{p.barcode}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-emerald-600 block">স্টক: {p.stockQuantity}</span>
                        <span className="text-xs font-mono text-neutral-500">{currencySymbol}{p.costPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Items Table */}
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
                      উপলব্ধ স্টক: {item.availableStock} {item.unitCode} | দর: {currencySymbol}{item.unitCost.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max={item.availableStock}
                      value={item.quantity}
                      onChange={(e) => updateItemQty(item.rowId, parseFloat(e.target.value) || 1)}
                      className="w-16 p-1 text-center font-mono font-bold border rounded-lg bg-white dark:bg-neutral-800 text-xs"
                    />
                    <span className="text-[10px] text-neutral-400">{item.unitCode}</span>

                    <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200 w-20 text-right">
                      {currencySymbol}{item.lineCost.toFixed(2)}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeItem(item.rowId)}
                      className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </form>

        <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 border-t flex justify-between items-center">
          <div className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100">
            মোট চালান মূল্য: {currencySymbol}{totalCost.toFixed(2)}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-xl text-xs font-semibold">
              বাতিল
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || items.length === 0 || !toBranchId}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Truck size={14} /> {loading ? "প্রেরণ হচ্ছে..." : "চালান প্রেরণ করুন (Dispatch)"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}