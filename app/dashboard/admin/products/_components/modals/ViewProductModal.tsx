"use client";

import React from "react";
import Image from "next/image";
import { Calendar } from "lucide-react";
import Modal from "@/components/common/Modal";
import { IProduct } from "@/types";

interface Props {
  product: IProduct | null;
  onClose: () => void;
  canViewCost?: boolean;
  currencySymbol?: string;
}

export default function ViewProductModal({
  product,
  onClose,
  canViewCost = false,
  currencySymbol = "৳",
}: Props) {
  if (!product) return null;

  return (
    <Modal
      isOpen={Boolean(product)}
      onClose={onClose}
      title="পণ্যের পূর্ণ বিবরণ ও স্পেসিফিকেশন"
      description={`বারকোড: #${product.barcode}`}
      maxWidth="lg"
    >
      <div className="space-y-5">
        <div className="flex items-start gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-white dark:bg-neutral-900 border flex items-center justify-center shrink-0">
            {product.image ? (
              <Image src={product.image} alt={product.name} width={64} height={64} className="w-16 h-16 object-cover" />
            ) : (
              <span className="text-2xl">📦</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 truncate">{product.name}</h3>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                  product.status === "active"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {product.status}
              </span>
            </div>
            {product.nameEn && <p className="text-xs text-neutral-400">{product.nameEn}</p>}
            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              <span>ক্যাটাগরি: <strong>{product.categoryName}</strong></span>
              <span>•</span>
              <span>ব্র্যান্ড: <strong>{product.brandName || "Unbranded"}</strong></span>
              <span>•</span>
              <span>তাক: <strong>{product.sectionName || "General Storage"}</strong></span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border text-xs">
          <div>
            <span className="text-neutral-400 block text-[10px] uppercase font-bold">বারকোড</span>
            <span className="font-mono font-bold">{product.barcode}</span>
          </div>
          <div>
            <span className="text-neutral-400 block text-[10px] uppercase font-bold">SKU Code</span>
            <span className="font-mono font-bold">{product.sku}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border">
          {canViewCost && (
            <div>
              <span className="text-[10px] text-neutral-400 block uppercase font-bold">ক্রয় দর</span>
              <span className="text-xs font-bold font-mono">{currencySymbol}{product.costPrice.toFixed(2)}</span>
            </div>
          )}
          <div>
            <span className="text-[10px] text-neutral-400 block uppercase font-bold">খুচরা দর</span>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
              {currencySymbol}{product.sellingPrice.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-neutral-400 block uppercase font-bold">পাইকারি দর</span>
            <span className="text-xs font-bold font-mono">
              {product.wholesalePrice ? `${currencySymbol}${product.wholesalePrice.toFixed(2)}` : "—"}
            </span>
          </div>
          {canViewCost && (
            <div>
              <span className="text-[10px] text-neutral-400 block uppercase font-bold">মার্জিন</span>
              <span className="text-xs font-bold text-emerald-600 font-mono">
                {product.sellingPrice > 0
                  ? `${(((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100).toFixed(1)}%`
                  : "0%"}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border text-xs">
          <div>
            <span className="text-neutral-400 block text-[10px] uppercase font-bold">ব্রাঞ্চ স্টক</span>
            <span className="font-bold font-mono">{product.stockQuantity} {product.unitCode}</span>
          </div>
          <div>
            <span className="text-neutral-400 block text-[10px] uppercase font-bold">অ্যালার্ট সীমা</span>
            <span className="text-amber-600 font-bold font-mono">{product.minStockAlert} {product.unitCode}</span>
          </div>
          <div>
            <span className="text-neutral-400 block text-[10px] uppercase font-bold">মেয়াদ</span>
            <span className="font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1 font-mono">
              <Calendar size={12} className="text-neutral-400" />
              {product.expiryDate || "মেয়াদহীন"}
            </span>
          </div>
        </div>

        {(product.conversionFactor ?? 0) > 1 && (
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 font-medium">
            📦 <strong>বাল্ক প্যাকেজিং রূপান্তর:</strong> ১ {product.bulkUnitName || "কার্টন"} = {product.conversionFactor} {product.unitName || ""} ({product.unitCode})
          </div>
        )}

        {product.description && (
          <div>
            <span className="text-neutral-400 text-[10px] uppercase font-bold block mb-1">বিবরণ</span>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 p-3 rounded-xl">
              {product.description}
            </p>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </Modal>
  );
}