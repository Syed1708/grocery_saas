"use client";

import { ISale } from "@/types";

interface Props {
  sale: ISale | null;
  shop: any;
  currencySymbol?: string;
}

export default function SaleInvoiceReceipt({
  sale,
  shop,
  currencySymbol = "৳",
}: Props) {
  if (!sale) return null;

  const is80mm = (shop?.thermalWidth || "80mm") === "80mm";
  const currency = currencySymbol || shop?.currencySymbol || "৳";

  return (
    <>
      {/* Strict Thermal Print CSS (No popups, zero page margin, no URL headers) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: ${shop?.thermalWidth || "80mm"} auto;
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
            width: ${is80mm ? "78mm" : "56mm"} !important;
            display: block !important;
            padding: 8px !important;
            font-family: monospace !important;
            box-sizing: border-box !important;
          }
        }
      `}} />

      {/* Printable Receipt Container */}
      <div id="sale-thermal-receipt" className="hidden print:block font-mono text-black text-[10px] leading-tight">
        {/* 1. Header Greeting */}
        {shop?.invoiceHeader && (
          <p className="text-center font-bold text-[9px] pb-1 border-b border-dotted border-black">
            {shop.invoiceHeader}
          </p>
        )}

        {/* 2. Store Brand & Specific Branch Information */}
        <div className="text-center py-1.5 border-b border-dashed border-black">
          <h1 className="font-extrabold text-xs uppercase">{shop?.name || "GROCERY STORE"}</h1>

          {/* 👈 Prints the specific branch where the sale occurred */}
          <h2 className="font-bold text-[10px] text-neutral-900 mt-0.5">
            শাখা: {sale.branchName || "Main Branch"}
          </h2>

          <p className="text-[9px] text-neutral-800 leading-normal">
            {shop?.address || ""}
          </p>
          <p className="text-[9px]">
            ফোন: {shop?.phone || ""}
          </p>

          {shop?.enableVat && shop?.binVatNumber && (
            <p className="text-[8px] font-mono mt-0.5">BIN/VAT: {shop.binVatNumber}</p>
          )}
        </div>

        {/* 3. Invoice Metadata */}
        <div className="py-1 border-b border-black text-[9px] space-y-0.5">
          <div className="flex justify-between">
            <span>ইনভয়েস নং: #{sale.invoiceNo}</span>
            <span>{new Date(sale.saleDate).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span>ক্যাশিয়ার: {sale.cashierName || "Staff"}</span>
            <span>{new Date(sale.saleDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
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
          {sale.items.map((it: any, idx: number) => (
            <div key={idx} className="space-y-0.5 text-[9px]">
              <span className="font-bold block truncate">{it.productName}</span>
              <div className="flex justify-between text-neutral-700">
                <span>{it.quantity} {it.unitCode || "pcs"} x {currency}{Number(it.unitPrice).toFixed(2)}</span>
                <span className="font-bold text-black">{currency}{Number(it.lineTotal).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 5. Financial Totals */}
        <div className="py-1.5 border-b-2 border-black space-y-0.5 text-[10px]">
          <div className="flex justify-between font-bold">
            <span>সাবটোটাল:</span>
            <span>{currency}{Number(sale.subtotal).toFixed(2)}</span>
          </div>
          {sale.discount > 0 && (
            <div className="flex justify-between">
              <span>ডিসকাউন্ট:</span>
              <span>-{currency}{Number(sale.discount).toFixed(2)}</span>
            </div>
          )}
          {sale.vatAmount > 0 && (
            <div className="flex justify-between">
              <span>ভ্যাট (+):</span>
              <span>+{currency}{Number(sale.vatAmount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-black text-xs pt-1 border-t border-dotted border-black">
            <span>সর্বমোট বিল:</span>
            <span>{currency}{Number(sale.grandTotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-neutral-800">
            <span>পরিশোধিত ({sale.paymentMethod?.toUpperCase()}):</span>
            <span>{currency}{Number(sale.paidAmount).toFixed(2)}</span>
          </div>
          {sale.changeAmount > 0 && (
            <div className="flex justify-between font-bold text-emerald-800">
              <span>ফেরত দেওয়া হয়েছে:</span>
              <span>{currency}{Number(sale.changeAmount).toFixed(2)}</span>
            </div>
          )}
          {sale.dueAmount > 0 && (
            <div className="flex justify-between font-black text-red-600">
              <span>বকেয়া বাকি:</span>
              <span>{currency}{Number(sale.dueAmount).toFixed(2)}</span>
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