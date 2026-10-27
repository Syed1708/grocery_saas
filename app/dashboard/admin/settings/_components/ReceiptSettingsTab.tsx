"use client";

import { useState } from "react";
import { Input } from "@/components/common/ui/Input";
import { Textarea } from "@/components/common/ui/Textarea";
import { IShopSettings, IBranchSettings } from "@/types/settings";
import { toast } from "sonner";
import { Save, Loader2, Printer } from "lucide-react";
import { updateReceiptSettingsAction } from "@/app/actions/settings-actions"; // Adjust import path if needed

interface Props {
  shop: IShopSettings;
  activeBranch?: IBranchSettings | null; // 👈 Add activeBranch prop
}

export default function ReceiptSettingsTab({ shop, activeBranch }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    thermalWidth: (shop.thermalWidth as "80mm" | "58mm") || "80mm",
    banglaReceipt: shop.banglaReceipt ?? true,
    invoiceHeader: shop.invoiceHeader || "বিসমিল্লাহির রাহমানির রাহিম",
    invoiceFooter: shop.invoiceFooter || "বিক্রিত পণ্য ৭ দিনের মধ্যে রসিদসহ পরিবর্তনযোগ্য। ধন্যবাদ!",
  });

  const currency = shop.currencySymbol || "৳";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await updateReceiptSettingsAction(formData);
    setLoading(false);

    if (res.success) {
      toast.success("POS receipt settings saved successfully!");
    } else {
      toast.error(res.error || "Failed to save settings.");
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Configuration Form */}
      <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <Printer size={18} className="text-blue-600" />
          <div>
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              রসিদ ও থার্মাল প্রিন্টার কনফিগারেশন (POS Receipt)
            </h2>
            <p className="text-xs text-neutral-500">Configure thermal paper size, language, and greeting notes</p>
          </div>
        </div>

        {/* Paper Width Selection */}
        <div>
          <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
            থার্মাল প্রিন্টার কাগজের প্রস্থ (Paper Width) *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, thermalWidth: "80mm" })}
              className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                formData.thermalWidth === "80mm"
                  ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 font-bold"
                  : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50"
              }`}
            >
              <span className="block text-xs font-bold">80 মিমি (Standard POS)</span>
              <span className="text-[10px] text-neutral-400">Default for standard grocery thermal printers</span>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, thermalWidth: "58mm" })}
              className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                formData.thermalWidth === "58mm"
                  ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 font-bold"
                  : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50"
              }`}
            >
              <span className="block text-xs font-bold">58 মিমি (Mini Thermal)</span>
              <span className="text-[10px] text-neutral-400">For compact hand-held mobile printers</span>
            </button>
          </div>
        </div>

        {/* Bangla Receipt Toggle */}
        <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block">
              বাংলা রসিদ প্রিন্ট (Bangla Receipt)
            </span>
            <span className="text-[11px] text-neutral-400">
              Print receipt labels, column names, and currency in Bengali
            </span>
          </div>
          <input
            type="checkbox"
            checked={formData.banglaReceipt}
            onChange={(e) => setFormData({ ...formData, banglaReceipt: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded cursor-pointer"
          />
        </div>

        <Input
          label="রসিদ হেডার মেসেজ (Header Note)"
          placeholder="বিসমিল্লাহির রাহমানির রাহিম"
          value={formData.invoiceHeader}
          onChange={(e) => setFormData({ ...formData, invoiceHeader: e.target.value })}
        />

        <Textarea
          label="রসিদ ফুটার পলিসি (Footer Return Policy)"
          rows={2}
          placeholder="বিক্রিত পণ্য ৭ দিনের মধ্যে রসিদসহ পরিবর্তনযোগ্য..."
          value={formData.invoiceFooter}
          onChange={(e) => setFormData({ ...formData, invoiceFooter: e.target.value })}
        />

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            <span>রসিদ সেটিংস সংরক্ষণ করুন</span>
          </button>
        </div>
      </form>

      {/* Live Thermal Receipt Simulator */}
      <div className="lg:col-span-5 flex flex-col items-center">
        <span className="text-[11px] font-bold text-neutral-400 mb-2 uppercase tracking-wider">
          রসিদ প্রিভিউ ({formData.thermalWidth} Live Simulator)
        </span>

        {/* 👈 Safe explicit pixel widths: w-[280px] vs w-[220px] */}
        <div
          className={`p-3 bg-white text-black font-mono shadow-md border border-neutral-300 rounded-md text-[10px] leading-tight transition-all ${
            formData.thermalWidth === "80mm" ? "w-70" : "w-55"
          }`}
        >
          {formData.invoiceHeader && (
            <p className="text-center font-bold text-[9px] pb-1 border-b border-dotted border-black">
              {formData.invoiceHeader}
            </p>
          )}

          {/* Store Brand & Dynamic Active Branch Details */}
          <div className="text-center py-1.5 border-b border-dashed border-black">
            <h3 className="font-extrabold text-xs uppercase">{shop.name}</h3>
            {activeBranch && (
              <p className="text-[10px] font-bold text-neutral-900 mt-0.5">
                শাখা: {activeBranch.name} [{activeBranch.code}]
              </p>
            )}
            <p className="text-[9px] text-neutral-800 leading-normal">
              {activeBranch?.address || shop.address || "ঠিকানা দেওয়া হয়নি"}
            </p>
            <p className="text-[9px]">
              ফোন: {activeBranch?.phone || shop.phone || "ফোন দেওয়া হয়নি"}
            </p>
            {shop.binVatNumber && (
              <p className="text-[8px] font-mono mt-0.5">BIN: {shop.binVatNumber}</p>
            )}
          </div>

          <div className="py-1 border-b border-black text-[9px] flex justify-between">
            <span>INV-26001</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>

          {/* Sample Line Items reacting to Bangla toggle */}
          <div className="py-1.5 border-b border-dashed border-black space-y-1">
            <div className="flex justify-between">
              <span>{formData.banglaReceipt ? "১. আড়ং তরল দুধ ১ লি" : "1. Aarong Milk 1L"}</span>
              <span className="font-bold">{currency}90.00</span>
            </div>
            <div className="flex justify-between">
              <span>{formData.banglaReceipt ? "২. তীর সয়াবিন তেল ৫ লি" : "2. Teer Oil 5L"}</span>
              <span className="font-bold">{currency}960.00</span>
            </div>
          </div>

          {/* Totals */}
          <div className="py-1 border-b border-black font-bold space-y-0.5 text-[10px]">
            <div className="flex justify-between">
              <span>{formData.banglaReceipt ? "সর্বমোট বিল:" : "Grand Total:"}</span>
              <span>{currency}1050.00</span>
            </div>
            <div className="flex justify-between text-neutral-700">
              <span>{formData.banglaReceipt ? "নগদ জমা:" : "Paid Amount:"}</span>
              <span>{currency}1050.00</span>
            </div>
          </div>

          {formData.invoiceFooter && (
            <p className="text-center text-[8px] pt-2 text-neutral-700 leading-normal border-t border-dotted border-black mt-1">
              {formData.invoiceFooter}
            </p>
          )}

          <p className="text-center text-[7px] pt-1 text-neutral-400">*** Software by Grocery SaaS ***</p>
        </div>
      </div>
    </div>
  );
}