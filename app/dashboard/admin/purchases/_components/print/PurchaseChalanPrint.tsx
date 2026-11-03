"use client";

import { IPurchase } from "@/types/purchase";

export type PrintFormat = "80mm" | "58mm" | "a4";

interface Props {
  invoice: IPurchase | null;
  shopName: string;
  shopAddress?: string;
  shopPhone?: string;
  currencySymbol?: string;
  format?: PrintFormat;
}

export default function PurchaseChalanPrint({
  invoice,
  shopName,
  shopAddress = "",
  shopPhone = "",
  currencySymbol = "৳",
  format = "80mm",
}: Props) {
  if (!invoice) return null;

  const isA4 = format === "a4";
  const is58mm = format === "58mm";
  const is80mm = format === "80mm" || (!isA4 && !is58mm);
  const thermalWidth = is80mm ? "78mm" : "56mm";
  const paperWidth = is80mm ? "80mm" : is58mm ? "58mm" : "A4";

  return (
    <>
      {/* Dynamic Print CSS Engine */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: ${isA4 ? "A4 portrait" : `${paperWidth} auto`};
                margin: ${isA4 ? "12mm 15mm" : "0"} !important;
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
              #purchase-print-container, #purchase-print-container * {
                visibility: visible !important;
              }
              #purchase-print-container {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: ${isA4 ? "100%" : thermalWidth} !important;
                display: block !important;
                padding: ${isA4 ? "0" : "8px"} !important;
                box-sizing: border-box !important;
              }
            }
          `,
        }}
      />

      <div
        id="purchase-print-container"
        className={`hidden print:block text-black select-none ${
          isA4 ? "font-sans text-xs leading-relaxed" : "font-mono text-[10px] leading-tight"
        }`}
      >
        {/* ========================================================= */}
        {/* LAYOUT 1: CORPORATE A4 FORMAT                             */}
        {/* ========================================================= */}
        {isA4 ? (
          <div className="space-y-6">
            {/* Store & Document Header */}
            <div className="flex justify-between items-start pb-4 border-b-2 border-neutral-900">
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tight text-neutral-900">
                  {shopName}
                </h1>
                <p className="text-xs text-neutral-600 mt-1">{shopAddress}</p>
                <p className="text-xs text-neutral-600">হেল্পলাইন: {shopPhone}</p>
                <span className="inline-block mt-1 text-[11px] font-bold px-2 py-0.5 bg-neutral-100 border rounded">
                  শাখা: {invoice.branchName || "Main Branch"}
                </span>
              </div>

              <div className="text-right space-y-1">
                <span className="inline-block px-3 py-1 bg-neutral-900 text-white font-bold text-xs uppercase tracking-wider rounded">
                  ক্রয় চালান ও স্টক ইনওয়ার্ড কপি
                </span>
                <p className="font-mono text-sm font-bold text-neutral-900 pt-1">
                  চালান নং: #{invoice.chalanNo}
                </p>
                <p className="text-xs text-neutral-600 font-mono">
                  তারিখ: {new Date(invoice.purchaseDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Supplier / Vendor Details Card */}
            <div className="grid grid-cols-2 gap-4 p-3.5 bg-neutral-50 border rounded-xl text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">সরবরাহকারী (Supplier)</span>
                <strong className="text-sm text-neutral-900 block font-bold">
                  {invoice.supplierCompany || invoice.supplierName}
                </strong>
                <p className="text-neutral-600 text-xs">প্রতিনিধি (SR): {invoice.supplierName}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">পেমেন্ট মাধ্যম</span>
                <p className="font-bold text-neutral-900 uppercase">{invoice.paymentMethod}</p>
                <p className="text-neutral-600">মোবাইল: {invoice.supplierPhone || "N/A"}</p>
              </div>
            </div>

            {/* Itemized Table */}
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-100 border-y border-neutral-300 font-bold text-neutral-700">
                  <th className="py-2.5 px-3 w-12 text-center">#</th>
                  <th className="py-2.5 px-3">পণ্যের বিবরণ (Item)</th>
                  <th className="py-2.5 px-3 text-center w-24">পরিমাণ (Qty)</th>
                  <th className="py-2.5 px-3 text-right w-28">ক্রয় দর (Rate)</th>
                  <th className="py-2.5 px-3 text-right w-24">কমিশন</th>
                  <th className="py-2.5 px-3 text-right w-32">মোট মূল্য</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {invoice.items.map((it, idx) => (
                  <tr key={it.id || idx}>
                    <td className="py-2.5 px-3 text-center text-neutral-400 font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <strong className="text-neutral-900 block font-semibold">{it.productName}</strong>
                      {it.barcode && <span className="text-[10px] text-neutral-400 font-mono">({it.barcode})</span>}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold">
                      {it.quantity} {it.unitCode || "pcs"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {currencySymbol}{it.unitCost.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-neutral-500">
                      {it.commission > 0 ? `-${currencySymbol}${it.commission.toFixed(2)}` : "-"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-neutral-900">
                      {currencySymbol}{it.lineTotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Calculations Grid */}
            <div className="flex justify-between items-start pt-2">
              <div className="w-1/2 p-3 bg-neutral-50 rounded-xl text-xs space-y-1">
                <span className="font-bold block text-neutral-700">বিশেষ মন্তব্য / নোট:</span>
                <p className="text-neutral-600 italic">{invoice.notes || "কোনো বিশেষ মন্তব্য নেই।"}</p>
              </div>

              <div className="w-80 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-neutral-600">
                  <span>সাবটোটাল:</span>
                  <span>{currencySymbol}{invoice.subtotal.toFixed(2)}</span>
                </div>
                {invoice.discount > 0 && (
                  <div className="flex justify-between text-red-600 font-semibold">
                    <span>বিশেষ ছাড় (-):</span>
                    <span>-{currencySymbol}{invoice.discount.toFixed(2)}</span>
                  </div>
                )}
                {invoice.transportCost > 0 && (
                  <div className="flex justify-between text-neutral-600">
                    <span>পরিবহন ও কুলি (+):</span>
                    <span>+{currencySymbol}{invoice.transportCost.toFixed(2)}</span>
                  </div>
                )}
                {invoice.vatAmount > 0 && (
                  <div className="flex justify-between text-neutral-600">
                    <span>ভ্যাট ({invoice.vatPercent}%):</span>
                    <span>+{currencySymbol}{invoice.vatAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-neutral-900 pt-1.5 border-t border-neutral-300">
                  <span>চালান মূল্য (Grand Total):</span>
                  <span>{currencySymbol}{invoice.grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>পরিশোধিত (Paid):</span>
                  <span>{currencySymbol}{invoice.paidAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-rose-600 font-bold text-sm pt-1 border-t border-neutral-200">
                  <span>চালানের বাকি দেনা (Due):</span>
                  <span>{currencySymbol}{invoice.dueAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Corporate Dual Signature Block */}
            <div className="grid grid-cols-2 gap-16 text-center text-xs pt-16">
              <div>
                <div className="border-t-2 border-neutral-900 pt-1.5 font-bold">মাল গ্রহণকারীর স্বাক্ষর ও সিল (Store Inward)</div>
              </div>
              <div>
                <div className="border-t-2 border-neutral-900 pt-1.5 font-bold">সরবরাহকারীর প্রতিনিধি স্বাক্ষর (Supplier SR)</div>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* LAYOUT 2: 80mm & 58mm COMPACT THERMAL FORMAT              */
          /* ========================================================= */
          <div className="space-y-1">
            <div className="text-center pb-1.5 border-b-2 border-black">
              <h1 className="font-extrabold text-xs uppercase">{shopName}</h1>
              <p className="text-[9px]">ক্রয় চালান ভাউচার (PURCHASE INWARD)</p>
              <h2 className="font-bold text-[10px] mt-0.5">শাখা: {invoice.branchName || "Main Branch"}</h2>
              {shopAddress && <p className="text-[9px] text-neutral-800">{shopAddress}</p>}
            </div>

            <div className="py-1 border-b border-black text-[9px] space-y-0.5">
              <div className="flex justify-between">
                <span>চালান নং: #{invoice.chalanNo}</span>
                <span>{new Date(invoice.purchaseDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>সাপ্লায়ার:</span>
                <span className="truncate max-w-[130px]">{invoice.supplierCompany || invoice.supplierName}</span>
              </div>
            </div>

            <div className="py-1 border-b border-dashed border-black space-y-1">
              <div className="flex justify-between font-bold border-b border-dotted border-black pb-0.5 text-[9px]">
                <span>পণ্য (Item)</span>
                <span>মোট</span>
              </div>
              {invoice.items.map((it, idx) => (
                <div key={idx} className="space-y-0.5 text-[9px]">
                  <span className="font-bold block truncate">{it.productName}</span>
                  <div className="flex justify-between text-neutral-800">
                    <span>{it.quantity} {it.unitCode || "pcs"} x {currencySymbol}{it.unitCost.toFixed(2)}</span>
                    <span className="font-bold">{currencySymbol}{it.lineTotal.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="py-1.5 border-b-2 border-black space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>সাবটোটাল:</span>
                <span>{currencySymbol}{invoice.subtotal.toFixed(2)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between">
                  <span>ছাড় (-):</span>
                  <span>-{currencySymbol}{invoice.discount.toFixed(2)}</span>
                </div>
              )}
              {invoice.transportCost > 0 && (
                <div className="flex justify-between">
                  <span>লেবার/কুলি (+):</span>
                  <span>+{currencySymbol}{invoice.transportCost.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-xs pt-1 border-t border-dotted border-black">
                <span>চালান মূল্য:</span>
                <span>{currencySymbol}{invoice.grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>পরিশোধিত ({invoice.paymentMethod?.toUpperCase()}):</span>
                <span>{currencySymbol}{invoice.paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-red-600">
                <span>চালানের বাকি:</span>
                <span>{currencySymbol}{invoice.dueAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center text-[8px] pt-8">
              <div><p className="border-t border-dotted border-black pt-1">মাল গ্রহণকারীর স্বাক্ষর</p></div>
              <div><p className="border-t border-dotted border-black pt-1">সরবরাহকারীর স্বাক্ষর</p></div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}