"use client";

import { useEffect, useState } from "react";
import FormModal from "@/components/common/FormModal";
import { IPurchaseReportRow, IPurchaseItemDetail } from "@/types/purchases";
import { Loader2 } from "lucide-react";
import { fetchPurchaseChalanItemsAction } from "@/app/actions/purchase-report-actions";

interface Props {
  chalan: IPurchaseReportRow | null;
  currencySymbol: string;
  onClose: () => void;
}

export default function PurchaseDetailsModal({ chalan, currencySymbol, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<IPurchaseItemDetail[]>([]);

  useEffect(() => {
    if (!chalan) return;
    setLoading(true);
    fetchPurchaseChalanItemsAction(chalan.id)
      .then((res) => {
        if (res.success && res.data) setItems(res.data);
      })
      .finally(() => setLoading(false));
  }, [chalan]);

  if (!chalan) return null;

  return (
    <FormModal
      isOpen={!!chalan}
      onClose={onClose}
      onSubmit={(e) => { e.preventDefault(); window.print(); }}
      title={`ক্রয় চালান বিবরণী: #${chalan.chalanNo}`}
      description={`সাপ্লায়ার: ${chalan.supplierName} (${chalan.companyName || "N/A"}) | তারিখ: ${new Date(chalan.purchaseDate).toLocaleDateString()}`}
      submitLabel="চালান প্রিন্ট করুন"
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* Header Summary Cards */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs">
          <div>
            <span className="text-[10px] text-neutral-400 block font-semibold">মোট চালানের মান</span>
            <span className="font-mono font-bold">{currencySymbol}{chalan.grandTotal.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-[10px] text-emerald-600 block font-semibold">নগদ পরিশোধ</span>
            <span className="font-mono font-bold text-emerald-600">{currencySymbol}{chalan.paidAmount.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-[10px] text-red-600 block font-semibold">বকেয়া দেনা</span>
            <span className="font-mono font-black text-red-600">{currencySymbol}{chalan.dueAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Line Items Table */}
        {loading ? (
          <div className="py-12 flex justify-center items-center gap-2 text-neutral-400 text-xs">
            <Loader2 className="animate-spin" size={16} /> চালানের মালামাল লোড হচ্ছে...
          </div>
        ) : (
          <div className="max-h-[350px] overflow-y-auto border border-neutral-200 dark:border-neutral-800 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-neutral-100 dark:bg-neutral-800 sticky top-0 font-semibold border-b border-neutral-200 dark:border-neutral-700 text-[11px]">
                <tr>
                  <th className="p-2.5">পণ্য বিবরণী</th>
                  <th className="p-2.5 text-right">পরিমাণ (Qty)</th>
                  <th className="p-2.5 text-right">একক ক্রয় দর</th>
                  <th className="p-2.5 text-right">মোট মান (Total)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-b border-neutral-100 dark:border-neutral-800/60 text-[11px]">
                    <td className="p-2.5">
                      <span className="font-bold block text-neutral-900 dark:text-neutral-100">{it.productName}</span>
                      <span className="text-[10px] font-mono text-neutral-400">{it.barcode}</span>
                    </td>
                    <td className="p-2.5 text-right font-mono font-semibold">
                      {it.quantity} {it.unitCode}
                    </td>
                    <td className="p-2.5 text-right font-mono text-neutral-600">
                      {currencySymbol}{it.unitCost.toFixed(2)}
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100">
                      {currencySymbol}{it.lineTotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </FormModal>
  );
}