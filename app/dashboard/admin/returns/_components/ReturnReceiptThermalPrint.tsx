"use client";

import { ICompletedReturn, IPosShopConfig } from "@/types/sale";

interface Props {
  returnData: ICompletedReturn | null;
  shop: IPosShopConfig;
}

export default function ReturnReceiptThermalPrint({ returnData, shop }: Props) {
  if (!returnData) return null;

  const is80mm = (shop?.thermalWidth || "80mm") === "80mm";
  const paperWidth = is80mm ? "80mm" : "58mm";
  const printContentWidth = is80mm ? "78mm" : "56mm";
  const currency = shop?.currencySymbol || "৳";

  const isCash = returnData.refundMethod.toLowerCase() === "cash";
  const safeDate = new Date(returnData.returnDate);

  return (
    <>
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
              #return-thermal-slip, #return-thermal-slip * {
                visibility: visible !important;
              }
              #return-thermal-slip {
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

      <div
        id="return-thermal-slip"
        className="hidden print:block font-mono text-black text-[10px] leading-tight select-none"
      >
        {/* Header */}
        <div className="text-center py-1.5 border-b border-dashed border-black">
          <h1 className="font-extrabold text-xs uppercase">{shop?.name || "GROCERY STORE"}</h1>
          <h2 className="font-bold text-[10px] mt-0.5">শাখা: {returnData.branchName}</h2>
          <p className="text-[9px] mt-0.5 font-bold uppercase tracking-wider bg-black text-white py-0.5">
            ** পণ্য ফেরত ভাউচার (RETURN SLIP) **
          </p>
        </div>

        {/* Return Details */}
        <div className="py-1 border-b border-black text-[9px] space-y-0.5">
          <div className="flex justify-between font-bold">
            <span>রিটার্ন রসিদ #:</span>
            <span>#{returnData.returnNo}</span>
          </div>
          <div className="flex justify-between">
            <span>মূল চালান (Sale #):</span>
            <span>#{returnData.invoiceNo}</span>
          </div>
          <div className="flex justify-between">
            <span>তারিখ ও সময়:</span>
            <span>{safeDate.toLocaleDateString()} {safeDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          <div className="flex justify-between">
            <span>ক্যাশিয়ার:</span>
            <span>{returnData.cashierName}</span>
          </div>
          <div className="flex justify-between font-bold pt-0.5 border-t border-dotted border-black">
            <span>গ্রাহক:</span>
            <span>{returnData.customerName}</span>
          </div>
        </div>

        {/* Returned Items */}
        <div className="py-1.5 border-b border-dashed border-black space-y-1">
          <div className="flex justify-between font-bold border-b border-dotted border-black pb-0.5 text-[9px]">
            <span>ফেরত পণ্য (Item)</span>
            <span>মোট</span>
          </div>
          {returnData.items.map((it, idx) => (
            <div key={idx} className="space-y-0.5 text-[9px]">
              <div className="flex justify-between">
                <span className="font-bold truncate">{it.productName}</span>
                <span className="text-[8px] font-bold">
                  {it.condition === "RESTOCK" ? "[রিস্টক]" : "[ড্যামেজ]"}
                </span>
              </div>
              <div className="flex justify-between text-neutral-800">
                <span>{it.quantity} {it.unitCode || "pcs"} x {currency}{it.refundPrice.toFixed(2)}</span>
                <span className="font-bold">{currency}{it.lineTotal.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Refund Total */}
        <div className="py-1.5 border-b-2 border-black space-y-0.5 text-[10px]">
          <div className="flex justify-between font-black text-xs">
            <span>মোট রিফান্ড বিল:</span>
            <span>{currency}{returnData.totalRefund.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-neutral-800 pt-0.5">
            <span>ফেরতের মাধ্যম:</span>
            <span>{isCash ? "নগদ ক্যাশ ফেরত" : "বাকির খাতা সমন্বয়"}</span>
          </div>
          {returnData.notes && (
            <div className="text-[8.5px] italic pt-0.5 text-neutral-700">
              নোট: {returnData.notes}
            </div>
          )}
        </div>

        {/* Customer & Cashier Signatures */}
        <div className="pt-6 pb-2 grid grid-cols-2 gap-4 text-center text-[8px]">
          <div>
            <div className="border-t border-dotted border-black pt-1">ক্যাশিয়ারের স্বাক্ষর</div>
          </div>
          <div>
            <div className="border-t border-dotted border-black pt-1">গ্রাহকের স্বাক্ষর</div>
          </div>
        </div>
      </div>
    </>
  );
}