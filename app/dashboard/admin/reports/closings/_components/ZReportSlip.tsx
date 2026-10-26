"use client";

import { ICashRegisterClosing } from "@/types/closing";

interface Props {
  closing: ICashRegisterClosing;
  currency: string;
  shop: {
    name: string;
    phone?: string | null;
    address?: string | null;
  };
  branchName: string;
}

export default function ZReportSlip({ closing, currency, shop, branchName }: Props) {
  const diff = Number(closing.difference);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: 80mm auto;
            margin: 0 !important;
          }
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
          }
          body * {
            visibility: hidden !important;
          }
          #z-report-thermal-slip, #z-report-thermal-slip * {
            visibility: visible !important;
          }
          #z-report-thermal-slip {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 78mm !important;
            display: block !important;
            padding: 8px !important;
            font-family: monospace !important;
            box-sizing: border-box !important;
          }
        }
      `}} />

      <div id="z-report-thermal-slip" className="hidden print:block text-black font-mono text-[10px] leading-tight">
        {/* Header */}
        <div className="text-center pb-2 border-b border-dashed border-black">
          <h1 className="font-extrabold text-xs uppercase">{shop.name}</h1>
          <p className="text-[10px] font-bold">ব্রাঞ্চ: {branchName}</p>
          {shop.address && <p className="text-[9px]">{shop.address}</p>}
          {shop.phone && <p className="text-[9px]">ফোন: {shop.phone}</p>}

          <div className="mt-1 pt-1 border-t border-dotted border-black">
            <h2 className="font-bold text-[11px] uppercase">দৈনিক কাউন্টার ক্লোজিং (Z-REPORT)</h2>
            <p className="text-[9px]">
              তারিখ: {new Date(closing.closingDate).toLocaleDateString()} | সময়: {closing.closingTime || "Night Close"}
            </p>
            <p className="text-[9px]">ক্যাশিয়ার: {closing.user?.name || "Authorized Staff"}</p>
          </div>
        </div>

        {/* Shift Cash Flow Inflows */}
        <div className="py-2 border-b border-dashed border-black space-y-1">
          <div className="flex justify-between font-bold">
            <span>মোট ইনভয়েস স্লিপ:</span>
            <span>{closing.totalInvoices} টি</span>
          </div>
          <div className="flex justify-between">
            <span>প্রারম্ভিক ক্যাশ ফ্লোট:</span>
            <span>{currency}{closing.openingCash.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>(+) নগদ ক্যাশ বিক্রয়:</span>
            <span>+{currency}{closing.cashSales.toFixed(2)}</span>
          </div>
          {closing.cashDueCollected > 0 && (
            <div className="flex justify-between">
              <span>(+) বকেয়া কালেকশন:</span>
              <span>+{currency}{closing.cashDueCollected.toFixed(2)}</span>
            </div>
          )}
          {closing.cashOtherIncome > 0 && (
            <div className="flex justify-between">
              <span>(+) অন্যান্য নগদ আয়:</span>
              <span>+{currency}{closing.cashOtherIncome.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>(-) ক্যাশ খরচ:</span>
            <span>-{currency}{closing.cashExpenses.toFixed(2)}</span>
          </div>
          {closing.cashSupplierPaid > 0 && (
            <div className="flex justify-between">
              <span>(-) মহাজন পরিষদ:</span>
              <span>-{currency}{closing.cashSupplierPaid.toFixed(2)}</span>
            </div>
          )}
          {closing.cashRefunds > 0 && (
            <div className="flex justify-between">
              <span>(-) নগদ রিফান্ড:</span>
              <span>-{currency}{closing.cashRefunds.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Reconciliation */}
        <div className="py-2 border-b border-dashed border-black space-y-1 font-bold text-[11px]">
          <div className="flex justify-between">
            <span>সিস্টেম প্রত্যাশিত ক্যাশ:</span>
            <span>{currency}{closing.expectedCash.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>বাস্তব গণনাকৃত ক্যাশ:</span>
            <span>{currency}{closing.countedCash.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span>গরমিল (Discrepancy):</span>
            <span>
              {diff > 0
                ? `+${currency}${diff.toFixed(2)} (উদ্বৃত্ত)`
                : diff < 0
                ? `-${currency}${Math.abs(diff).toFixed(2)} (ঘাটতি)`
                : "০.০০ (সঠিক)"}
            </span>
          </div>
        </div>

        {closing.notes && (
          <div className="py-1.5 border-b border-dashed border-black text-[9px]">
            <p><strong>মন্তব্য:</strong> {closing.notes}</p>
          </div>
        )}

        <div className="pt-3 text-center text-[9px]">
          <p>*** ক্যাশ ড্রয়ার লক সম্পন্ন ***</p>
          <div className="mt-6 flex justify-between border-t border-black pt-1 px-1">
            <span>ক্যাশিয়ার স্বাক্ষর</span>
            <span>ম্যানেজার স্বাক্ষর</span>
          </div>
        </div>
      </div>
    </>
  );
}