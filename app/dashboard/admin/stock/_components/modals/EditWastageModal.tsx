"use client";
"use no memo";

import React, { useState } from "react";
import { X, Save, Trash2, AlertOctagon } from "lucide-react";
import { toast } from "sonner";
import { IStockWastage, WastageReason } from "@/types/stock-wastage";
import { updateStockWastageAction } from "@/app/actions/stock-wastage-actions";

interface Props {
  wastage: IStockWastage;
  onClose: () => void;
  currencySymbol?: string;
}

export default function EditWastageModal({
  wastage,
  onClose,
  currencySymbol = "৳",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState<WastageReason>(wastage.reason);
  const [notes, setNotes] = useState(wastage.notes || "");

  // 🛡️ Direct state initialization (no illegal useEffect) [1]
  const [items, setItems] = useState(() =>
    wastage.items.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      unitCode: i.unitCode || "pcs",
      quantity: i.quantity,
      unitCost: i.unitCost,
      lineCost: i.lineCost,
      reason: i.reason || wastage.reason,
    }))
  );

  const updateItemQty = (productId: string, qty: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? {
              ...i,
              quantity: Math.max(1, qty),
              lineCost: Math.max(1, qty) * i.unitCost,
            }
          : i
      )
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return toast.error("কমপক্ষে একটি পণ্য রাখুন।");

    setLoading(true);
    const res = await updateStockWastageAction({
      id: wastage.id,
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
      toast.success("নষ্ট মাল রেকর্ড ও স্টক সফলভাবে আপডেট হয়েছে!");
      onClose();
    } else {
      toast.error(res.error || "আপডেট ব্যর্থ হয়েছে।");
    }
  };

  const totalCost = items.reduce((sum, i) => sum + i.lineCost, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        <div className="p-5 border-b flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <AlertOctagon className="text-red-500" size={18} />
              নষ্ট মাল রেকর্ড সম্পাদনা: #{wastage.wastageNo}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">শাখা: {wastage.branchName}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-neutral-400 rounded-xl">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-semibold mb-1">নষ্টের কারণ:</label>
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

          <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800">
            {items.map((item) => (
              <div key={item.productId} className="p-3 text-xs flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span className="font-semibold block truncate">{item.productName}</span>
                  <span className="text-[11px] text-neutral-400 font-mono">
                    দর: {currencySymbol}{item.unitCost.toFixed(2)} | ক্ষতি: {currencySymbol}
                    {item.lineCost.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItemQty(item.productId, parseFloat(e.target.value) || 1)}
                    className="w-16 p-1 text-center font-mono font-bold border rounded-lg bg-white dark:bg-neutral-800 text-xs"
                  />
                  <span className="text-[10px] text-neutral-400">{item.unitCode}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    className="p-1 text-neutral-400 hover:text-red-600 rounded-lg"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">মন্তব্য (Notes):</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 text-xs border rounded-xl bg-white dark:bg-neutral-800"
            />
          </div>
        </form>

        <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 border-t flex justify-between items-center">
          <div className="text-xs font-mono font-bold text-red-600">
            সংশোধিত আর্থিক ক্ষতি: {currencySymbol}{totalCost.toFixed(2)}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-xl text-xs font-semibold"
            >
              বাতিল
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading || items.length === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
            >
              <Save size={14} /> {loading ? "আপডেট হচ্ছে..." : "আপডেট সংরক্ষণ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}