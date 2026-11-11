"use client";

import React, { useState } from "react";
import {
  MessageCircle,
  Printer,
  Save,
  X,
  Search,
  Sparkles,
  AlertCircle,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import {
  getSupplierReorderSuggestionsAction,
  createPurchaseOrderAction,
} from "@/app/actions/purchase-order-actions";
import { ReorderSuggestionItem } from "@/types/purchase-order";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  suppliers: any[];
  shopName: string;
  currencySymbol?: string;
}

export default function SROrderModal({
  isOpen,
  onClose,
  suppliers = [],
  shopName,
  currencySymbol = "৳",
}: Props) {
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ReorderSuggestionItem[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, number>>({});
  const [supplierData, setSupplierData] = useState<any>(null);
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const handleSelectSupplier = async (id: string) => {
    setSelectedSupplierId(id);
    if (!id) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    const res = await getSupplierReorderSuggestionsAction(id);
    setLoading(false);

    if (res.success && res.suggestions) {
      setSuggestions(res.suggestions);
      setSupplierData(res.supplier);

      // Pre-fill suggested quantities for items below alert stock
      const initialMap: Record<string, number> = {};
      res.suggestions.forEach((item) => {
        if (item.currentStock <= item.minStockAlert) {
          initialMap[item.id] = item.suggestedQty;
        }
      });
      setOrderItems(initialMap);
    } else {
      toast.error(res.error || "পণ্য লোড করতে ব্যর্থ হয়েছে।");
    }
  };

  const updateItemQty = (id: string, qty: number) => {
    setOrderItems((prev) => {
      const next = { ...prev };
      if (qty <= 0) {
        delete next[id];
      } else {
        next[id] = qty;
      }
      return next;
    });
  };

  // Build WhatsApp Message String
  const generateWhatsAppMessage = () => {
    const activeItems = suggestions.filter((s) => (orderItems[s.id] || 0) > 0);
    if (activeItems.length === 0) return "";

    let text = `*${shopName} - অর্ডার ডিমান্ড*\n`;
    text += `সরবরাহকারী: ${supplierData?.companyName || supplierData?.name}\n`;
    text += `তারিখ: ${new Date().toLocaleDateString("bn-BD")}\n\n`;

    activeItems.forEach((item, idx) => {
      const qty = orderItems[item.id];
      text += `${idx + 1}. *${item.name}* -> ${qty} ${item.unitCode}\n`;
    });

    text += `\nঅনুগ্রহ করে দ্রুত ডেলিভারি নিশ্চিত করুন। ধন্যবাদ!`;
    return encodeURIComponent(text);
  };

  const handleSendWhatsApp = () => {
    const text = generateWhatsAppMessage();
    if (!text) return toast.error("কমপক্ষে একটি পণ্যের পরিমাণ নির্ধারণ করুন।");

    const phone = supplierData?.phone ? supplierData.phone.replace(/[^0-9]/g, "") : "";
    const cleanPhone = phone.startsWith("0") ? `88${phone}` : phone;
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${text}`
      : `https://wa.me/?text=${text}`;

    window.open(url, "_blank");
    toast.success("হোয়াটসঅ্যাপে অর্ডার পাঠানো হচ্ছে...");
  };

  const handleSavePO = async () => {
    const validItems = Object.entries(orderItems).map(([id, qty]) => {
      const p = suggestions.find((s) => s.id === id);
      return {
        productId: id,
        quantity: qty,
        unitCost: p?.unitCost || 0,
      };
    });

    if (validItems.length === 0) {
      return toast.error("কমপক্ষে একটি পণ্য অর্ডারে যুক্ত করুন।");
    }

    setLoading(true);
    const res = await createPurchaseOrderAction({
      supplierId: selectedSupplierId,
      items: validItems,
    });
    setLoading(false);

    if (res.success) {
      toast.success(`অর্ডার #${res.orderNo} সফলভাবে ড্রাফট হিসেবে সংরক্ষিত হয়েছে!`);
      onClose();
    } else {
      toast.error(res.error || "সংরক্ষণ ব্যর্থ হয়েছে।");
    }
  };

  const filteredSuggestions = suggestions.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.barcode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Sparkles className="text-blue-600" size={18} />
              এসআর অর্ডার ও ডিমান্ড শীট (SR Order Prep)
            </h2>
            <p className="text-xs text-neutral-500">
              কোম্পানির কম স্টক হওয়া পণ্য নির্বাচন করে সরাসরি হোয়াটসঅ্যাপ বা স্লিপে অর্ডার দিন
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 rounded-xl"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Supplier Picker */}
          <div>
            <label className="block text-xs font-semibold mb-1">
              কোম্পানি / সরবরাহকারী বাছাই করুন:
            </label>
            <select
              value={selectedSupplierId}
              onChange={(e) => handleSelectSupplier(e.target.value)}
              className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-medium"
            >
              <option value="">-- সরবরাহকারী নির্বাচন করুন --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.companyName || s.name} ({s.phone || "No Phone"})
                </option>
              ))}
            </select>
          </div>

          {selectedSupplierId && (
            <>
              {/* Search & Summary Bar */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-2.5 text-neutral-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="পণ্য বা বারকোড খুঁজুন..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl"
                  />
                </div>
                <div className="text-xs font-bold text-blue-600">
                  অর্ডারে যুক্ত: {Object.keys(orderItems).length} টি
                </div>
              </div>

              {/* Items List */}
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800">
                {filteredSuggestions.length === 0 ? (
                  <div className="p-8 text-center text-xs text-neutral-400">
                    এই কোম্পানির কোন পণ্য পাওয়া যায়নি।
                  </div>
                ) : (
                  filteredSuggestions.map((item) => {
                    const isLow = item.currentStock <= item.minStockAlert;
                    const qty = orderItems[item.id] || 0;

                    return (
                      <div
                        key={item.id}
                        className={`p-3 text-xs flex items-center justify-between gap-3 ${
                          isLow ? "bg-amber-50/40 dark:bg-amber-950/20" : ""
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                              {item.name}
                            </span>
                            {isLow && (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400">
                                কম স্টক
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-neutral-400 font-mono">
                            বর্তমান স্টক: <b>{item.currentStock} {item.unitCode}</b> | ক্রয়মূল্য: {currencySymbol}{item.unitCost}
                          </div>
                        </div>

                        {/* Quantity Counter */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => updateItemQty(item.id, Math.max(0, qty - 1))}
                            className="w-7 h-7 rounded-lg border border-neutral-300 dark:border-neutral-700 flex items-center justify-center font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={qty || ""}
                            placeholder="0"
                            onChange={(e) => updateItemQty(item.id, parseInt(e.target.value) || 0)}
                            className="w-14 h-7 text-center font-mono font-bold text-xs border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800"
                          />
                          <button
                            type="button"
                            onClick={() => updateItemQty(item.id, qty + 1)}
                            className="w-7 h-7 rounded-lg border border-neutral-300 dark:border-neutral-700 flex items-center justify-center font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSavePO}
            disabled={loading || Object.keys(orderItems).length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 text-neutral-800 dark:text-neutral-100 text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            <Save size={14} /> ড্রাফট অর্ডার সংরক্ষণ (Save PO)
          </button>

          <button
            type="button"
            onClick={handleSendWhatsApp}
            disabled={Object.keys(orderItems).length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            <MessageCircle size={16} /> হোয়াটসঅ্যাপে অর্ডার পাঠান
          </button>
        </div>
      </div>
    </div>
  );
}