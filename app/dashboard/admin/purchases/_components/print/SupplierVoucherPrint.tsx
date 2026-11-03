"use client";

import { PrintFormat } from "./PurchaseChalanPrint";

interface Props {
  details: any | null;
  shopName: string;
  shopAddress?: string;
  shopPhone?: string;
  currencySymbol?: string;
  format?: PrintFormat;
}

export default function SupplierVoucherPrint({
  details,
  shopName,
  shopAddress = "",
  shopPhone = "",
  currencySymbol = "৳",
  format = "80mm",
}: Props) {
  if (!details) return null;

  const isA4 = format === "a4";
  const is58mm = format === "58mm";
  const is80mm = format === "80mm" || (!isA4 && !is58mm);
  const thermalWidth = is80mm ? "78mm" : "56mm";
  const paperWidth = is80mm ? "80mm" : is58mm ? "58mm" : "A4";

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: ${isA4 ? "A4 portrait" : `${paperWidth} auto`};
                margin: ${isA4 ? "15mm 20mm" : "0"} !important;
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
              #supplier-voucher-container, #supplier-voucher-container * {
                visibility: visible !important;
              }
              #supplier-voucher-container {
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
        id="supplier-voucher-container"
        className={`hidden print:block text-black select-none ${
          isA4 ? "font-sans text-xs leading-relaxed" : "font-mono text-[10px] leading-tight"
        }`}
      >
        {/* ========================================================= */}
        {/* LAYOUT 1: CORPORATE A4 PAYMENT DEBIT VOUCHER              */}
        {/* ========================================================= */}
        {isA4 ? (
          <div className="space-y-6">
            <div className="flex justify-between items-start pb-4 border-b-2 border-neutral-900">
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tight">{shopName}</h1>
                <p className="text-xs text-neutral-600 mt-1">{shopAddress}</p>
                <p className="text-xs text-neutral-600">ফোন: {shopPhone}</p>
              </div>

              <div className="text-right space-y-1">
                <span className="inline-block px-3 py-1 bg-neutral-900 text-white font-bold text-xs uppercase tracking-wider rounded">
                  অফিসিয়াল ডেবিট ভাউচার (DEBIT VOUCHER)
                </span>
                <p className="font-mono text-sm font-bold pt-1">ভাউচার নং: #{details.voucherNo}</p>
                <p className="text-xs text-neutral-600 font-mono">
                  তারিখ: {new Date(details.date || Date.now()).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Payee Info Banner */}
            <div className="p-4 bg-neutral-50 border rounded-xl grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">অর্থ প্রাপক (Payee / Supplier)</span>
                <strong className="text-sm font-bold text-neutral-900 block">
                  {details.companyName || details.supplierName}
                </strong>
                <p className="text-neutral-600">যোগাযোগ: {details.supplierName} • {details.phone}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">উৎস অ্যাকাউন্ট / পেমেন্ট মোড</span>
                <p className="font-bold text-neutral-900 uppercase">{details.paymentMethod}</p>
                {details.reference && <p className="text-neutral-600 font-mono">রেফারেন্স: {details.reference}</p>}
              </div>
            </div>

            {/* Ledger Financial Grid */}
            <table className="w-full text-left border-collapse text-xs my-4">
              <thead>
                <tr className="bg-neutral-100 border-y border-neutral-300 font-bold text-neutral-700">
                  <th className="py-2.5 px-3">খাত / বিবরণ (Description)</th>
                  <th className="py-2.5 px-3 text-right">পূর্বের বকেয়া</th>
                  <th className="py-2.5 px-3 text-right">পরিশোধের পরিমাণ</th>
                  <th className="py-2.5 px-3 text-right">অবশিষ্ট বকেয়া</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 font-mono text-sm">
                <tr>
                  <td className="py-3 px-3 font-sans text-xs">
                    মহাজনের বকেয়া পাওনা বাবদ পরিশোধ
                    {details.reference && <span className="block text-[11px] text-neutral-400">মেমো/চেক রেফারেন্স: {details.reference}</span>}
                  </td>
                  <td className="py-3 px-3 text-right text-neutral-700">
                    {currencySymbol}{Number(details.previousDue || 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-emerald-700">
                    {currencySymbol}{Number(details.amountPaid || 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-rose-600">
                    {currencySymbol}{Number(details.remainingDue || 0).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Signatures */}
            <div className="grid grid-cols-3 gap-8 text-center text-xs pt-20">
              <div><p className="border-t-2 border-neutral-900 pt-1.5 font-bold">প্রস্তুতকারীর স্বাক্ষর</p></div>
              <div><p className="border-t-2 border-neutral-900 pt-1.5 font-bold">অনুমোদনকারীর স্বাক্ষর (মালিক)</p></div>
              <div><p className="border-t-2 border-neutral-900 pt-1.5 font-bold">টাকা গ্রহণকারীর স্বাক্ষর (SR)</p></div>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* LAYOUT 2: 80mm & 58mm COMPACT THERMAL FORMAT              */
          /* ========================================================= */
          <div className="space-y-1">
            <div className="text-center pb-1.5 border-b-2 border-black">
              <h1 className="font-extrabold text-xs uppercase">{shopName}</h1>
              <p className="text-[9px] font-bold">পেমেন্ট ভাউচার (PAYMENT VOUCHER)</p>
            </div>

            <div className="py-1 border-b border-black text-[9px] space-y-0.5">
              <div className="flex justify-between">
                <span>ভাউচার নং: #{details.voucherNo}</span>
                <span>{new Date(details.date || Date.now()).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>সাপ্লায়ার:</span>
                <span className="truncate max-w-[130px]">{details.companyName || details.supplierName}</span>
              </div>
            </div>

            <div className="py-2 border-b-2 border-black space-y-1 text-right text-xs">
              <div className="flex justify-between">
                <span>পূর্বের বকেয়া:</span>
                <span>{currencySymbol}{Number(details.previousDue || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-sm">
                <span>পরিশোধের পরিমাণ:</span>
                <span>{currencySymbol}{Number(details.amountPaid || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-neutral-800">
                <span>পেমেন্ট মাধ্যম:</span>
                <span>{details.paymentMethod?.toUpperCase()}</span>
              </div>
              {details.reference && (
                <div className="flex justify-between text-[9px] text-neutral-600">
                  <span>রেফারেন্স:</span>
                  <span>{details.reference}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t border-black pt-1">
                <span>অবশিষ্ট বাকি:</span>
                <span>{currencySymbol}{Number(details.remainingDue || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center text-[8px] pt-10">
              <div><p className="border-t border-dotted border-black pt-1">অনুমোদনকারীর স্বাক্ষর</p></div>
              <div><p className="border-t border-dotted border-black pt-1">টাকা গ্রহণকারীর স্বাক্ষর (SR)</p></div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}