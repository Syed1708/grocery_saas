"use client";

import { ISale, IPosShopConfig, ISaleItem } from "@/types/sale";

interface Props {
  sale: ISale | null;
  shop: IPosShopConfig;
  currencySymbol?: string;
}

export default function SaleInvoiceReceipt({
  sale,
  shop,
  currencySymbol,
}: Props) {
  if (!sale) return null;

  // 1. Strict Whitelist against CSS Injection
  const is80mm = (shop?.thermalWidth || "80mm") === "80mm";
  const paperWidth = is80mm ? "80mm" : "58mm";
  const printContentWidth = is80mm ? "78mm" : "56mm";
  const currency = currencySymbol || shop?.currencySymbol || "৳";

  // Helper for safe number formatting (Blocks NaN runtime crashes)
  const formatMoney = (val?: number | string | null) => Number(val || 0).toFixed(2);

  // Safe date parser
  const safeDate = sale.saleDate ? new Date(sale.saleDate) : new Date();

  return (
    <>
      {/* Strict Thermal Print CSS (No popups, zero page margin, no URL headers) */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: ${paperWidth} auto;
                margin: 0 !important;
              }
              body {
                background: white !important;
                color: black !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              body * {
                visibility: hidden !important;
              }
              #sale-thermal-receipt, #sale-thermal-receipt * {
                visibility: visible !important;
              }
              #sale-thermal-receipt {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: ${printContentWidth} !important;
                display: block !important;
                padding: 8px !important;
                font-family: monospace !important;
                box-sizing: border-box !important;
              }
            }
          `,
        }}
      />

      {/* Printable Receipt Container */}
      <div
        id="sale-thermal-receipt"
        className="hidden print:block font-mono text-black text-[10px] leading-tight select-none"
      >
        {/* 1. Header Greeting Note */}
        {shop?.invoiceHeader && (
          <p className="text-center font-bold text-[9px] pb-1 border-b border-dotted border-black">
            {shop.invoiceHeader}
          </p>
        )}

        {/* 2. Store Brand & Branch Information */}
        <div className="text-center py-1.5 border-b border-dashed border-black">
          <h1 className="font-extrabold text-xs uppercase">{shop?.name || "GROCERY STORE"}</h1>

          {/* Prints the exact branch where the transaction took place */}
          <h2 className="font-bold text-[10px] text-neutral-900 mt-0.5">
            শাখা: {sale.branchName || "Main Branch"}
          </h2>

          {shop?.address && (
            <p className="text-[9px] text-neutral-800 leading-normal">{shop.address}</p>
          )}
          {shop?.phone && (
            <p className="text-[9px]">ফোন: {shop.phone}</p>
          )}
        </div>

        {/* 3. Invoice Metadata */}
        <div className="py-1 border-b border-black text-[9px] space-y-0.5">
          <div className="flex justify-between">
            <span>ইনভয়েস নং: #{sale.invoiceNo}</span>
            <span>{safeDate.toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span>ক্যাশিয়ার: {sale.cashierName || "Staff"}</span>
            <span>{safeDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          {sale.customerName && (
            <div className="flex justify-between font-bold pt-0.5">
              <span>গ্রাহক: {sale.customerName}</span>
              <span>{sale.customerPhone || ""}</span>
            </div>
          )}
        </div>

        {/* 4. Purchased Items */}
        <div className="py-1.5 border-b border-dashed border-black space-y-1">
          <div className="flex justify-between font-bold border-b border-dotted border-black pb-0.5 text-[9px]">
            <span>বিবরণ (Item)</span>
            <span>মোট</span>
          </div>
          {(sale.items || []).map((it: ISaleItem, idx: number) => (
            <div key={it.id || idx} className="space-y-0.5 text-[9px]">
              <span className="font-bold block truncate">{it.productName}</span>
              <div className="flex justify-between text-neutral-700">
                <span>
                  {it.quantity} {it.unitCode || "pcs"} x {currency}{formatMoney(it.unitPrice)}
                </span>
                <span className="font-bold text-black">{currency}{formatMoney(it.lineTotal)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 5. Financial Totals */}
        <div className="py-1.5 border-b-2 border-black space-y-0.5 text-[10px]">
          <div className="flex justify-between font-bold">
            <span>সাবটোটাল:</span>
            <span>{currency}{formatMoney(sale.subtotal)}</span>
          </div>
          {Number(sale.discount || 0) > 0 && (
            <div className="flex justify-between">
              <span>ডিসকাউন্ট:</span>
              <span>-{currency}{formatMoney(sale.discount)}</span>
            </div>
          )}
          {Number(sale.vatAmount || 0) > 0 && (
            <div className="flex justify-between">
              <span>ভ্যাট (+):</span>
              <span>+{currency}{formatMoney(sale.vatAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-black text-xs pt-1 border-t border-dotted border-black">
            <span>সর্বমোট বিল:</span>
            <span>{currency}{formatMoney(sale.grandTotal)}</span>
          </div>

          {/* Paid Amount */}
          <div className="flex justify-between font-bold text-neutral-900">
            <span>পরিশোধিত ({sale.paymentMethod ? sale.paymentMethod.toUpperCase() : "CASH"}):</span>
            <span>{currency}{formatMoney(sale.paidAmount)}</span>
          </div>

          {/* 👈 Detailed Split Payment Breakdown (Cash, bKash, Bank) */}
          {sale.splitPayments && (
            <div className="pl-2 space-y-0.5 text-[8.5px] text-neutral-800 border-l border-dotted border-black my-0.5 font-semibold">
              {Number(sale.splitPayments.cash || 0) > 0 && (
                <div className="flex justify-between">
                  <span>• নগদ (Cash):</span>
                  <span>{currency}{formatMoney(sale.splitPayments.cash)}</span>
                </div>
              )}
              {Number(sale.splitPayments.bkash || 0) > 0 && (
                <div className="flex justify-between">
                  <span>• বিকাশ/নগদ (bKash):</span>
                  <span>{currency}{formatMoney(sale.splitPayments.bkash)}</span>
                </div>
              )}
              {Number(sale.splitPayments.bank || 0) > 0 && (
                <div className="flex justify-between">
                  <span>• ব্যাংক/কার্ড (Bank):</span>
                  <span>{currency}{formatMoney(sale.splitPayments.bank)}</span>
                </div>
              )}
            </div>
          )}

          {Number(sale.changeAmount || 0) > 0 && (
            <div className="flex justify-between font-bold text-emerald-800">
              <span>ফেরত দেওয়া হয়েছে:</span>
              <span>{currency}{formatMoney(sale.changeAmount)}</span>
            </div>
          )}
          {Number(sale.dueAmount || 0) > 0 && (
            <div className="flex justify-between font-black text-red-600">
              <span>বকেয়া বাকি:</span>
              <span>{currency}{formatMoney(sale.dueAmount)}</span>
            </div>
          )}
        </div>

        {/* 6. Footer Policy */}
        <div className="pt-2 text-center text-[8px] text-neutral-700 leading-normal">
          <p>{shop?.invoiceFooter || "বিক্রিত পণ্য ৭ দিনের মধ্যে রসিদসহ পরিবর্তনযোগ্য।"}</p>
          <p className="mt-1 font-bold">*** ধন্যবাদ আবার আসবেন ***</p>
        </div>
      </div>
    </>
  );
}