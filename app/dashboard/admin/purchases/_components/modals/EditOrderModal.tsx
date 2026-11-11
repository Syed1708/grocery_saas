"use client";
"use no memo";

import React, { useState } from "react";
import { X, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { IPurchaseOrder, IPurchaseOrderItem } from "@/types/purchase-order";
import { updatePurchaseOrderAction } from "@/app/actions/purchase-order-actions";

interface Props {
  order: IPurchaseOrder;
  onClose: () => void;
  currencySymbol?: string;
}

export default function EditOrderModal({
  order,
  onClose,
  currencySymbol = "৳",
}: Props) {
  const [loading, setLoading] = useState(false);

  // 🛡️ React 19 Idiomatic Pattern: Initialize directly without useEffect
  // State resets automatically whenever the parent changes key={order.id}
  const [items, setItems] = useState<IPurchaseOrderItem[]>(
    () => order.items || []
  );

  const updateQty = (productId: string, qty: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? {
              ...i,
              quantity: Math.max(1, qty),
              lineTotal: Math.max(1, qty) * Number(i.unitCost),
            }
          : i
      )
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const handleSave = async () => {
    if (items.length === 0) {
      return toast.error("কমপক্ষে একটি পণ্য অর্ডারে রাখুন।");
    }

    setLoading(true);
    const res = await updatePurchaseOrderAction({
      id: order.id,
      items: items.map((i) => ({
        productId: i.productId,
        quantity: Number(i.quantity),
        unitCost: Number(i.unitCost),
      })),
    });
    setLoading(false);

    if (res.success) {
      toast.success("অর্ডার সফলভাবে আপডেট হয়েছে!");
      onClose();
    } else {
      toast.error(res.error || "আপডেট ব্যর্থ হয়েছে।");
    }
  };

  const total = items.reduce((sum, i) => sum + Number(i.lineTotal || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold">
              অর্ডার সম্পাদনা: #{order.orderNo}
            </h2>
            <p className="text-xs text-neutral-400">
              সরবরাহকারী: {order.supplierCompany || order.supplierName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-xl"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-8 text-neutral-400 text-xs">
              কোন পণ্য পাওয়া যায়নি।
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.productId}
                className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl flex items-center justify-between text-xs gap-3 border border-neutral-100 dark:border-neutral-800"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200 block truncate">
                    {item.productName}
                  </span>
                  <span className="text-[11px] text-neutral-400 font-mono">
                    দর: {currencySymbol}
                    {Number(item.unitCost).toFixed(2)} | লাইন মোট:{" "}
                    {currencySymbol}
                    {Number(item.lineTotal).toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity || ""}
                      onChange={(e) =>
                        updateQty(item.productId, parseInt(e.target.value) || 1)
                      }
                      className="w-16 p-1.5 text-center font-mono font-bold border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-xs"
                    />
                    <span className="text-[10px] text-neutral-400">
                      {item.unitCode || "pcs"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                    title="আইটেম বাদ দিন"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
          <div className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100">
            নতুন মোট: {currencySymbol}
            {total.toFixed(2)}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
              বাতিল
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading || items.length === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Save size={14} />{" "}
              {loading ? "সংরক্ষণ হচ্ছে..." : "আপডেট সংরক্ষণ করুন"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}