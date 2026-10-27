"use client";

import { useState } from "react";
import { Input } from "@/components/common/ui/Input";
import { IShopSettings } from "@/types/settings";
import { updateVatSettingsAction } from "@/app/actions/settings-actions";
import { toast } from "sonner";
import { Save, Loader2, Percent, ShieldCheck } from "lucide-react";

export default function VatSettingsTab({ shop }: { shop: IShopSettings }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    enableVat: shop.enableVat ?? false,
    vatPercent: shop.vatPercent ?? 0,
    binVatNumber: shop.binVatNumber || "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await updateVatSettingsAction(formData);
    setLoading(false);

    if (res.success) {
      toast.success("VAT & Tax settings updated successfully!");
    } else {
      toast.error(res.error || "Failed to save settings.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
        <Percent size={18} className="text-blue-600" />
        <div>
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            সরকারি ভ্যাট ও কর সেটিংস (VAT & Tax)
          </h2>
          <p className="text-xs text-neutral-500">Enable default sales VAT and NBR BIN registration</p>
        </div>
      </div>

      {/* Enable VAT Toggle Card */}
      <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 rounded-xl flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 block">
            বিক্রয়ের উপর ভ্যাট চালু করুন (Enable Sales VAT)
          </span>
          <span className="text-[11px] text-neutral-400">
            Automatically calculate and apply VAT percentage during POS checkout
          </span>
        </div>
        <input
          type="checkbox"
          checked={formData.enableVat}
          onChange={(e) => setFormData({ ...formData, enableVat: e.target.checked })}
          className="w-4 h-4 text-blue-600 rounded cursor-pointer"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="ডিফল্ট ভ্যাট হার (VAT Percentage %) *"
          type="number"
          step="0.01"
          min="0"
          max="100"
          disabled={!formData.enableVat}
          value={formData.vatPercent}
          onChange={(e) => setFormData({ ...formData, vatPercent: Number(e.target.value) })}
        />

        <Input
          label="NBR ৯-ডিজিটের BIN / VAT নম্বর"
          placeholder="001294821-0101"
          value={formData.binVatNumber}
          onChange={(e) => setFormData({ ...formData, binVatNumber: e.target.value })}
        />
      </div>

      <div className="p-3 bg-blue-50/60 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 text-xs flex items-center gap-2 text-blue-800 dark:text-blue-300">
        <ShieldCheck size={16} />
        <span>BIN নম্বর রসিদে প্রিন্ট হবে, যা সরকারি ভ্যাট নিরীক্ষায় প্রযোজ্য।</span>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          <span>ভ্যাট কনফিগারেশন সংরক্ষণ করুন</span>
        </button>
      </div>
    </form>
  );
}