"use client";

interface Props {
  sale: any;
  shop: any;
}

export default function PosReceiptThermalPrint({ sale, shop }: Props) {
  if (!sale) return null;

  const is80mm = (shop?.thermalWidth || "80mm") === "80mm";
  const currency = shop?.currencySymbol || "৳";

  return (
    <>
      {/* Strict Thermal Print CSS (Zero margins, No URL headers, Popup-free) */}
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
          #pos-thermal-slip, #pos-thermal-slip * {
            visibility: visible !important;
          }
          #pos-thermal-slip {
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

      {/* 80mm / 58mm Thermal Print Container */}
      <div id="pos-thermal-slip" className="hidden print:block font-mono text-black text-[10px] leading-tight">
        {/* 1. Header Greeting Note */}
        {shop?.invoiceHeader && (
          <p className="text-center font-bold text-[9px] pb-1 border-b border-dotted border-black">
            {shop.invoiceHeader}
          </p>
        )}

        {/* 2. Store Brand & Active Branch Location */}
        <div className="text-center py-1.5 border-b border-dashed border-black">
          <h1 className="font-extrabold text-xs uppercase">{shop?.name || "GROCERY STORE"}</h1>
          
          {/* Active Branch Name */}
          <h2 className="font-bold text-[10px] text-neutral-900 mt-0.5">
            শাখা: {sale.branchName || "Main Branch"}
          </h2>

          {/* Active Branch Address & Phone */}
          <p className="text-[9px] text-neutral-800 leading-normal">
            {shop?.address || ""}
          </p>
          <p className="text-[9px]">
            হেল্পলাইন: {shop?.phone || ""}
          </p>

          {shop?.enableVat && shop?.binVatNumber && (
            <p className="text-[8px] font-mono mt-0.5">BIN/VAT: {shop.binVatNumber}</p>
          )}
        </div>

        {/* 3. Invoice Metadata */}
        <div className="py-1 border-b border-black text-[9px] space-y-0.5">
          <div className="flex justify-between">
            <span>ইনভয়েস: #{sale.invoiceNo}</span>
            <span>{new Date(sale.date || Date.now()).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span>ক্যাশিয়ার: {sale.cashierName}</span>
            <span>{new Date(sale.date || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          {sale.customer && (
            <div className="flex justify-between font-bold pt-0.5">
              <span>গ্রাহক: {sale.customer.name}</span>
              <span>{sale.customer.phone || ""}</span>
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
              <span className="font-bold block truncate">{it.name}</span>
              <div className="flex justify-between text-neutral-700">
                <span>{it.quantity} {it.unitCode || "pcs"} x {currency}{it.unitPrice.toFixed(2)}</span>
                <span className="font-bold text-black">{currency}{it.lineTotal.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 5. Totals Breakdown */}
        <div className="py-1.5 border-b-2 border-black space-y-0.5 text-[10px]">
          <div className="flex justify-between font-bold">
            <span>সাবটোটাল:</span>
            <span>{currency}{sale.subtotal.toFixed(2)}</span>
          </div>
          {sale.discount > 0 && (
            <div className="flex justify-between">
              <span>ডিসকাউন্ট:</span>
              <span>-{currency}{sale.discount.toFixed(2)}</span>
            </div>
          )}
          {sale.vatAmount > 0 && (
            <div className="flex justify-between">
              <span>ভ্যাট (+):</span>
              <span>+{currency}{sale.vatAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-black text-xs pt-1 border-t border-dotted border-black">
            <span>সর্বমোট বিল:</span>
            <span>{currency}{sale.grandTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-neutral-800">
            <span>পরিশোধিত:</span>
            <span>{currency}{sale.paidAmount.toFixed(2)}</span>
          </div>
          {sale.changeAmount > 0 && (
            <div className="flex justify-between font-bold text-emerald-800">
              <span>ফেরত:</span>
              <span>{currency}{sale.changeAmount.toFixed(2)}</span>
            </div>
          )}
          {sale.dueAmount > 0 && (
            <div className="flex justify-between font-black text-red-600">
              <span>বকেয়া বাকি:</span>
              <span>{currency}{sale.dueAmount.toFixed(2)}</span>
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