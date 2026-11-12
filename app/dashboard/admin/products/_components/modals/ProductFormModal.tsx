"use client";
"use no memo";

import React, { useState } from "react";
import { Sparkles, Barcode } from "lucide-react";
import FormModal from "@/components/common/FormModal";
import ImageUpload from "@/components/common/ImageUpload";
import { IProduct, ICategoryOption, IUnitOption } from "@/types";
import { ExtraOption } from "../ProductsClient";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => Promise<void>;
  editingProduct: IProduct | null;
  categories: ICategoryOption[];
  brands: ExtraOption[];
  sections: ExtraOption[];
  units: IUnitOption[];
  loading: boolean;
  currencySymbol?: string;
}

export default function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingProduct,
  categories = [],
  brands = [],
  sections = [],
  units = [],
  loading,
  currencySymbol = "৳",
}: Props) {
  const [barcodeInput, setBarcodeInput] = useState(editingProduct?.barcode || "");
  const [hasBulkPackaging, setHasBulkPackaging] = useState(
    Boolean(editingProduct?.bulkUnitName && Number(editingProduct?.conversionFactor) > 1)
  );

  function handleAutoBarcode() {
    const randomCode = `890${Math.floor(100000000 + Math.random() * 900000000)}`;
    setBarcodeInput(randomCode);
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title={editingProduct ? "পণ্য তথ্য সম্পাদনা (Edit Product)" : "নতুন মুদি পণ্য যুক্ত করুন"}
      description="পণ্যের নাম, তাক নম্বর, বারকোড, ক্রয়মূল্য, বিক্রয়মূল্য ও মেয়াদ কনফিগার করুন।"
      isEditing={Boolean(editingProduct)}
      loading={loading}
      submitLabel={editingProduct ? "আপডেট করুন" : "যুক্ত করুন"}
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* Name in Bangla & English */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1">
              পণ্যের নাম (বাংলা) *
            </label>
            <input
              type="text"
              name="name"
              required
              defaultValue={editingProduct?.name || ""}
              placeholder="যেমন: চিনি ১ কেজি, মিনিকেট চাল"
              className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-neutral-800 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">
              ইংরেজি নাম (English)
            </label>
            <input
              type="text"
              name="nameEn"
              defaultValue={editingProduct?.nameEn || ""}
              placeholder="e.g. Sugar 1kg, Miniket Rice"
              className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-neutral-800 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Category, Brand, Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1">ক্যাটাগরি *</label>
            <select
              name="categoryId"
              required
              defaultValue={editingProduct?.categoryId || ""}
              className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-neutral-800 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="" disabled>ক্যাটাগরি সিলেক্ট করুন</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">ব্র্যান্ড / কোম্পানি</label>
            <select
              name="brandId"
              defaultValue={editingProduct?.brandId || ""}
              className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-neutral-800 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">কোনো ব্র্যান্ড নেই (Unbranded)</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} {b.companyName ? `(${b.companyName})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">তাক বা সেকশন</label>
            <select
              name="sectionId"
              defaultValue={editingProduct?.sectionId || ""}
              className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-neutral-800 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">সাধারণ স্টোরেজ (General)</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.code ? `[${s.code}]` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Barcode with Auto Generator */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-semibold">বারকোড (Barcode)</label>
            <button
              type="button"
              onClick={handleAutoBarcode}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              <Sparkles size={12} /> অটো বারকোড তৈরি
            </button>
          </div>
          <div className="relative">
            <Barcode className="absolute left-3 top-2.5 text-neutral-400" size={16} />
            <input
              type="text"
              name="barcode"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="বারকোড স্ক্যানার গান দিয়ে স্ক্যান করুন অথবা অটো জেনারেট বাটনে চাপুন"
              className="w-full pl-9 pr-3 py-2 text-xs font-mono border rounded-xl bg-white dark:bg-neutral-800 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Pricing: Cost, Retail, Wholesale, VAT */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1">
              ক্রয়মূল্য ({currencySymbol})
            </label>
            <input
              type="number"
              step="0.01"
              name="costPrice"
              defaultValue={editingProduct?.costPrice ?? 0}
              placeholder="0.00"
              className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-neutral-800 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              খুচরা দর ({currencySymbol}) *
            </label>
            <input
              type="number"
              step="0.01"
              name="sellingPrice"
              required
              defaultValue={editingProduct?.sellingPrice ?? 0}
              placeholder="0.00"
              className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-neutral-800 font-bold outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">পাইকারি দর</label>
            <input
              type="number"
              step="0.01"
              name="wholesalePrice"
              defaultValue={editingProduct?.wholesalePrice ?? ""}
              placeholder="ঐচ্ছিক"
              className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-neutral-800 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">ভ্যাট (% VAT)</label>
            <input
              type="number"
              step="0.01"
              name="vatPercent"
              defaultValue={editingProduct?.vatPercent ?? 0}
              placeholder="0%"
              className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-neutral-800 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Unit, Expiry, Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1">পরিমাপ একক *</label>
            <select
              name="unitId"
              required
              defaultValue={editingProduct?.unitId || units[0]?.id || ""}
              className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-neutral-800 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">মেয়াদোত্তীর্ণ তারিখ</label>
            <input
              type="date"
              name="expiryDate"
              defaultValue={editingProduct?.expiryDate || ""}
              className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-neutral-800 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">অবস্থা *</label>
            <select
              name="status"
              defaultValue={editingProduct?.status || "active"}
              className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-neutral-800 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="active">সক্রিয় (Active)</option>
              <option value="inactive">নিষ্ক্রিয় (Inactive)</option>
            </select>
          </div>
        </div>

        {/* Stock & Alert */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1">প্রারম্ভিক মজুদ</label>
            <input
              type="number"
              step="0.01"
              name="stockQuantity"
              defaultValue={editingProduct?.stockQuantity ?? 0}
              placeholder="0.00"
              className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-neutral-800 font-bold outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">লো-স্টক সতর্কবার্তা সীমা</label>
            <input
              type="number"
              step="0.01"
              name="minStockAlert"
              defaultValue={editingProduct?.minStockAlert ?? 5}
              placeholder="5"
              className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-neutral-800 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Bulk Carton Conversion */}
        <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border space-y-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hasBulkPackaging}
              onChange={(e) => setHasBulkPackaging(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
            />
            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
              এই পণ্যটি কি কার্টন বা বক্সে আসে? (Bulk Package Conversion)
            </span>
          </label>

          {hasBulkPackaging && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t">
              <div>
                <label className="block text-[11px] font-medium mb-1">কার্টনের নাম</label>
                <input
                  type="text"
                  name="bulkUnitName"
                  defaultValue={editingProduct?.bulkUnitName || "Carton"}
                  placeholder="যেমন: Carton, Box, Sack"
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-neutral-900 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1">
                  ভেতরে কত পিস থাকে? (Conversion Factor)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="conversionFactor"
                  defaultValue={editingProduct?.conversionFactor ?? 24}
                  placeholder="যেমন: 24"
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-neutral-900 border rounded-lg font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Shelf Notes */}
        <div>
          <label className="block text-xs font-semibold mb-1">পণ্যের বিবরণ বা শেলফ নোট</label>
          <textarea
            name="description"
            rows={2}
            defaultValue={editingProduct?.description || ""}
            placeholder="স্টোরেজ নির্দেশিকা বা বিশেষ নোট..."
            className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-neutral-800 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Image Uploader */}
        <ImageUpload
          name="image"
          defaultImage={editingProduct?.image}
          label="পণ্যের ছবি আপলোড"
        />
      </div>
    </FormModal>
  );
}