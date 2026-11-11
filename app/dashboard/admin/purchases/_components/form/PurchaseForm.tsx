"use client";
"use no memo"; // 👈 Prevents React Compiler ref errors

import { useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Receipt } from "lucide-react";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { usePurchaseForm } from "./usePurchaseForm";
import SupplierPicker from "./SupplierPicker";
import PurchaseItemsTable from "./PurchaseItemsTable";
import PurchaseSummaryCard from "./PurchaseSummaryCard";
import ChalanPhotoUploader from "./ChalanPhotoUploader";

interface Props {
  mode?: "create" | "edit";
  initialData?: any;
  products: any[];
  suppliers: any[];
  activeBranchName: string;
  currencySymbol?: string;
  autoChalan?: string;
}

export default function PurchaseForm({
  mode = "create",
  initialData,
  products = [],
  suppliers = [],
  activeBranchName,
  currencySymbol = "৳",
  autoChalan = "",
}: Props) {
  // 🛡️ Keep the DOM ref local to this component (Blocks React 19 render errors)
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const focusBarcode = useCallback(() => {
    barcodeInputRef.current?.focus();
  }, []);

  const form = usePurchaseForm({
    mode,
    initialData,
    products,
    suppliers,
    autoChalan,
    onFocusBarcode: focusBarcode,
  });

  return (
    <div className="space-y-6 pb-16">
      <Breadcrumbs
        items={[
          { label: "ক্রয় ও সরবরাহকারী", href: "/dashboard/admin/purchases" },
          { label: mode === "edit" ? `চালান #${form.chalanNo} সম্পাদনা` : "নতুন ক্রয় চালান এন্ট্রি" },
        ]}
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight flex items-center gap-2">
            <Receipt className="text-blue-600" size={22} />
            {mode === "edit" ? `চালান #${form.chalanNo} সম্পাদনা` : "নতুন ক্রয় চালান এন্ট্রি (Inward Stock-In)"}
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            সাপ্লায়ার সিলেক্ট করুন, বারকোড স্ক্যান করুন এবং মালামাল সরাসরি বর্তমান ব্রাঞ্চে ইনওয়ার্ড করুন
          </p>
        </div>

        <Link
          href="/dashboard/admin/purchases"
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
        >
          <ArrowLeft size={14} /> ক্রয় তালিকায় ফিরে যান
        </Link>
      </div>

      <form onSubmit={form.handleSubmit} className="space-y-6">
        {/* 1. Supplier Picker */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs space-y-4">
          <SupplierPicker
            suppliers={suppliers}
            selectedSupplierId={form.selectedSupplierId}
            onSelectSupplier={form.handleSelectSupplier}
            searchQuery={form.supplierSearchQuery}
            onSearchChange={form.setSupplierSearchQuery}
            showDropdown={form.showSupplierDropdown}
            setShowDropdown={form.setShowSupplierDropdown}
            currencySymbol={currencySymbol}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                চালান / মেমো নম্বর <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.chalanNo}
                onChange={(e) => form.setChalanNo(e.target.value)}
                placeholder="e.g. CHAL-8902"
                className="w-full px-3 py-2 text-xs font-mono font-bold border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                চালানের তারিখ <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={form.purchaseDate}
                onChange={(e) => form.setPurchaseDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                মাল গ্রহণকারী ব্রাঞ্চ
              </label>
              <input
                type="text"
                disabled
                value={activeBranchName}
                className="w-full px-3 py-2 text-xs font-semibold bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-500 dark:text-neutral-400 cursor-not-allowed"
              />
            </div>
          </div>
        </div>


        {/* 2. Barcode Gun Scanner & Supplier Scope Chip */}
        <div className="bg-blue-50/50 dark:bg-blue-950/20 border-2 border-dashed border-blue-400 dark:border-blue-600 rounded-2xl p-4 shadow-xs space-y-3">

          <ChalanPhotoUploader
            imageUrl={form.chalanImageUrl}
            onImageChange={form.setChalanImageUrl}
          />
          {/* Supplier Focus Indicator & Override Toggle */}
          {form.selectedSupplier && (
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-blue-200/60 dark:border-blue-900/60 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-500">নির্বাচিত সরবরাহকারী:</span>
                <strong className="text-blue-700 dark:text-blue-300 font-bold">
                  {form.selectedSupplier.companyName || form.selectedSupplier.name}
                </strong>
              </div>

              {/* 1-Click Toggle: Company Only vs All Products */}
              <button
                type="button"
                onClick={() => form.setFilterBySupplier(!form.filterBySupplier)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${form.filterBySupplier
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300"
                  }`}
              >
                {form.filterBySupplier ? (
                  <>
                    <span>🎯 শুধু এই কোম্পানির পণ্য ({form.supplierFilteredProducts.length})</span>
                  </>
                ) : (
                  <>
                    <span>🌐 সকল পণ্য দেখানো হচ্ছে ({products.length})</span>
                  </>
                )}
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <span className="text-2xl p-2 bg-blue-100 dark:bg-blue-900/60 rounded-xl text-blue-600">📷</span>

            <div className="flex-1 w-full relative">
              <input
                ref={barcodeInputRef}
                type="text"
                value={form.barcodeSearch}
                onChange={(e) => {
                  form.setBarcodeSearch(e.target.value);
                  form.setShowProductSuggestions(true);
                }}
                onFocus={() => form.setShowProductSuggestions(true)}
                onKeyDown={form.handleBarcodeKeyDown}
                placeholder={
                  form.selectedSupplier && form.filterBySupplier
                    ? `[${form.selectedSupplier.companyName || "কোম্পানি"}] এর পণ্য খুঁজুন বা বারকোড স্ক্যান করুন...`
                    : "বারকোড স্ক্যান করুন অথবা পণ্যের নাম লিখুন..."
                }
                className="w-full px-4 py-2.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-neutral-900 dark:text-neutral-100 shadow-xs"
              />

              {/* Autocomplete Suggestions (Filtered by Company) */}
              {form.showProductSuggestions && form.filteredProducts.length > 0 && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => form.setShowProductSuggestions(false)}
                  />
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-700">
                    {form.filteredProducts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => form.addOrIncrementProduct(p)}
                        className="p-3 text-xs flex justify-between items-center hover:bg-neutral-50 dark:hover:bg-neutral-700/60 cursor-pointer"
                      >
                        <div>
                          <strong className="text-neutral-900 dark:text-neutral-100 block">{p.name}</strong>
                          <span className="font-mono text-[11px] text-neutral-400">বারকোড: {p.barcode}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-blue-600 block">
                            {currencySymbol}{Number(p.costPrice ?? p.purchasePrice ?? 0).toFixed(2)}
                          </span>
                          <span className="text-[10px] text-neutral-400">
                            স্টক: {p.stockQuantity ?? p.stock ?? 0} {p.unitCode || p.unit?.shortCode || "pcs"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={form.addEmptyRow}
              className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer shrink-0 shadow-xs flex items-center justify-center gap-1.5"
            >
              <Plus size={16} /> খালি সারি যোগ করুন
            </button>
          </div>
        </div>

        {/* 3. Line Items Table */}
        <PurchaseItemsTable
          items={form.items}
          products={form.supplierFilteredProducts} // 👈 Table dropdown only shows this company's items!
          onUpdateRow={form.updateRow}
          onRemoveRow={form.removeRow}
          highlightedRowId={form.highlightedRowId}
          currencySymbol={currencySymbol}
          sanitizeNumber={form.sanitizeNumber}
        />

        {/* 4. Pricing, Taxes & Dues Calculator */}
        <PurchaseSummaryCard
          totalQuantity={form.totalQuantity}
          subtotal={form.subtotal}
          discount={form.discount}
          onDiscountChange={form.setDiscount}
          transportCost={form.transportCost}
          onTransportCostChange={form.setTransportCost}
          vatPercent={form.vatPercent}
          onVatPercentChange={form.setVatPercent}
          grandTotal={form.grandTotal}
          supplierPreviousDue={form.supplierPreviousDue}
          netTotalPayable={form.netTotalPayable}
          paidAmount={form.paidAmount}
          onPaidAmountChange={form.setPaidAmount}
          chalanDue={form.chalanDue}
          finalSupplierBalance={form.finalSupplierBalance}
          paymentMethod={form.paymentMethod}
          onPaymentMethodChange={form.setPaymentMethod}
          notes={form.notes}
          onNotesChange={form.setNotes}
          loading={form.loading}
          disabledSubmit={form.items.filter((i) => i.productId).length === 0}
          currencySymbol={currencySymbol}
          mode={mode}
        />
      </form>
    </div>
  );
}