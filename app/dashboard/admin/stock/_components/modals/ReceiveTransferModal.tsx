"use client";
"use no memo";

import React, { useState } from "react";
import { X, PackageCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { IStockTransfer } from "@/types/stock-transfer";
import { receiveTransferAction } from "@/app/actions/stock-transfer-actions";

interface Props {
  transfer: IStockTransfer;
  onClose: () => void;
  currencySymbol?: string;
}

export default function ReceiveTransferModal({
  transfer,
  onClose,
  currencySymbol = "৳",
}: Props) {
  const [loading, setLoading] = useState(false);

  // Direct initialization: defaults received count to sent count
  const [items, setItems] = useState(() =>
    transfer.items.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      unitCode: i.unitCode || "pcs",
      quantitySent: i.quantitySent,
      quantityReceived: i.quantitySent, // Default: assume 100% arrived
      transitDamage: 0,
      unitCost: i.unitCost,
    }))
  );

  const updateItemReceived = (productId: string, val: number) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.productId !== productId) return i;
        const validReceived = Math.min(i.quantitySent, Math.max(0, val));
        const autoDamage = Math.max(0, i.quantitySent - validReceived);
        return {
          ...i,
          quantityReceived: validReceived,
          transitDamage: autoDamage,
        };
      })
    );
  };

  const updateItemDamage = (productId: string, damageVal: number) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.productId !== productId) return i;
        const validDamage = Math.min(i.quantitySent, Math.max(0, damageVal));
        const validReceived = Math.max(0, i.quantitySent - validDamage);
        return {
          ...i,
          transitDamage: validDamage,
          quantityReceived: validReceived,
        };
      })
    );
  };

  const handleConfirmReceive = async () => {
    setLoading(true);
    const res = await receiveTransferAction({
      transferId: transfer.id,
      items: items.map((i) => ({
        productId: i.productId,
        quantityReceived: i.quantityReceived,
        transitDamage: i.transitDamage,
        unitCost: i.unitCost,
      })),
    });
    setLoading(false);

    if (res.success) {
      toast.success("পণ্য সফলভাবে গ্রহণ ও বর্তমান ব্রাঞ্চের স্টকে যোগ করা হয়েছে!");
      onClose();
    } else {
      toast.error(res.error || "গ্রহণ সম্পন্ন করা যায়নি।");
    }
  };

  const totalDamaged = items.reduce((sum, i) => sum + i.transitDamage, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        <div className="p-5 border-b flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <PackageCheck className="text-emerald-600" size={18} />
              পণ্য গ্রহণ ও স্টক মিলকরণ: #{transfer.transferNo}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              প্রেরণকারী: <b>{transfer.fromBranchName}</b> | গাড়ি: {transfer.vehicleNo || "N/A"}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-neutral-400 rounded-xl">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          <p className="text-xs text-neutral-500">
            বক্সগুলো গুণে দেখুন। কোনো বোতল ভাঙা বা প্যাকেট লিক থাকলে "রাস্তায় ক্ষতি" কলামে লিখুন:
          </p>

          <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800">
            {items.map((it) => (
              <div key={it.productId} className="p-3 text-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1 min-w-[180px]">
                  <strong className="block text-neutral-800 dark:text-neutral-200">{it.productName}</strong>
                  <span className="text-[11px] text-neutral-400 font-mono">
                    পাঠানো হয়েছিল: <b>{it.quantitySent} {it.unitCode}</b>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div>
                    <label className="text-[10px] text-emerald-600 font-bold block text-center">ভালো পেয়েছি:</label>
                    <input
                      type="number"
                      min="0"
                      max={it.quantitySent}
                      value={it.quantityReceived}
                      onChange={(e) => updateItemReceived(it.productId, parseFloat(e.target.value) || 0)}
                      className="w-16 p-1.5 text-center font-mono font-bold text-xs border border-emerald-300 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-red-500 font-bold block text-center">ভাঙা/নষ্ট:</label>
                    <input
                      type="number"
                      min="0"
                      max={it.quantitySent}
                      value={it.transitDamage}
                      onChange={(e) => updateItemDamage(it.productId, parseFloat(e.target.value) || 0)}
                      className="w-16 p-1.5 text-center font-mono font-bold text-xs border border-red-300 rounded-lg bg-red-50/50 dark:bg-red-950/20 text-red-600"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalDamaged > 0 && (
            <div className="p-3 border border-dashed border-red-300 bg-red-50/60 dark:bg-red-950/30 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>
                <b>{totalDamaged} টি</b> নষ্ট পণ্য স্বয়ংক্রিয়ভাবে অপচয় লগ (Stock Wastage)-এ রেকর্ড হবে এবং
                কেবল ভালো পণ্যগুলো এই ব্রাঞ্চের স্টকে যোগ হবে।
              </span>
            </div>
          )}
        </div>

        <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 border-t flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-xl text-xs font-semibold">
            বাতিল
          </button>
          <button
            type="button"
            onClick={handleConfirmReceive}
            disabled={loading}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <PackageCheck size={15} /> {loading ? "গ্রহণ সম্পন্ন হচ্ছে..." : "পণ্য গ্রহণ নিশ্চিত করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}