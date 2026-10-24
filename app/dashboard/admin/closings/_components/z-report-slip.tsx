"use client";

import { ICashRegisterClosing } from "@/types/closing";

interface ZReportSlipProps {
  closing: ICashRegisterClosing;
  currency: string;
  shop: {
    name: string;
    phone?: string | null;
    address?: string | null;
  };
  branchName?: string;
}

export default function ZReportSlip({
  closing,
  currency,
  shop,
  branchName,
}: ZReportSlipProps) {
  const diff = Number(closing.difference);

  return (
    <>
      {/* Global Print Style to force 80mm receipt isolation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
          body * {
            visibility: hidden !important;
          }
          #thermal-print-area, #thermal-print-area * {
            visibility: visible !important;
          }
          #thermal-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 78mm !important;
            max-width: 78mm !important;
            margin: 0 !important;
            padding: 8px !important;
            color: #000000 !important;
            font-family: monospace !important;
          }
        }
      `}} />

      {/* 80mm Thermal Receipt Container */}
      <div id="thermal-print-area" className="hidden print:block text-black font-mono text-[11px] leading-tight">
        {/* Header: Store Info */}
        <div className="text-center pb-2 border-b border-dashed border-black">
          <h1 className="font-extrabold text-sm uppercase tracking-wide">{shop.name}</h1>
          {branchName && <p className="text-[10px] font-semibold">Branch: {branchName}</p>}
          {shop.address && <p className="text-[9px] text-neutral-800">{shop.address}</p>}
          {shop.phone && <p className="text-[9px]">{shop.phone}</p>}
          
          <div className="mt-2 pt-1 border-t border-dotted border-black">
            <h2 className="font-bold text-xs uppercase">DAILY Z-CLOSING REPORT</h2>
            <p className="text-[10px]">
              Date: {new Date(closing.closingDate).toLocaleDateString()} | Time: {closing.closingTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-[10px]">Cashier: {closing.user?.name || "Authorized Staff"}</p>
          </div>
        </div>

        {/* Shift Cash Flow Breakdown */}
        <div className="py-2 border-b border-dashed border-black space-y-1">
          <div className="flex justify-between font-semibold">
            <span>Invoices / Slips:</span>
            <span>{closing.totalInvoices}</span>
          </div>
          <div className="flex justify-between">
            <span>Opening Cash Float:</span>
            <span>{currency}{closing.openingCash.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>(+) Cash Sales:</span>
            <span>{currency}{closing.cashSales.toFixed(2)}</span>
          </div>
          {closing.cashDueCollected > 0 && (
            <div className="flex justify-between">
              <span>(+) Due Collected:</span>
              <span>{currency}{closing.cashDueCollected.toFixed(2)}</span>
            </div>
          )}
          {closing.cashOtherIncome > 0 && (
            <div className="flex justify-between">
              <span>(+) Other Income:</span>
              <span>{currency}{closing.cashOtherIncome.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-neutral-900">
            <span>(-) Cash Expenses:</span>
            <span>-{currency}{closing.cashExpenses.toFixed(2)}</span>
          </div>
          {closing.cashSupplierPaid > 0 && (
            <div className="flex justify-between">
              <span>(-) Supplier Payments:</span>
              <span>-{currency}{closing.cashSupplierPaid.toFixed(2)}</span>
            </div>
          )}
          {closing.cashRefunds > 0 && (
            <div className="flex justify-between">
              <span>(-) Cash Refunds:</span>
              <span>-{currency}{closing.cashRefunds.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Drawer Reconciliation */}
        <div className="py-2 border-b border-dashed border-black space-y-1 font-bold">
          <div className="flex justify-between">
            <span>Expected In Drawer:</span>
            <span>{currency}{closing.expectedCash.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Physical Counted:</span>
            <span>{currency}{closing.countedCash.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Discrepancy:</span>
            <span>
              {diff > 0 ? `+${currency}${diff.toFixed(2)} (Surplus)` : diff < 0 ? `-${currency}${Math.abs(diff).toFixed(2)} (Shortage)` : "0.00 (Balanced)"}
            </span>
          </div>
        </div>

        {/* Notes (if any) */}
        {closing.notes && (
          <div className="py-2 border-b border-dashed border-black text-[10px]">
            <p className="font-semibold">Closing Notes:</p>
            <p className="italic">{closing.notes}</p>
          </div>
        )}

        {/* Signature & End */}
        <div className="pt-4 text-center text-[10px]">
          <p className="tracking-widest">*** SHIFT REGISTER CLOSED ***</p>
          <div className="mt-8 flex justify-between border-t border-black pt-1 px-2 text-[9px]">
            <span>Cashier Signature</span>
            <span>Manager Signature</span>
          </div>
        </div>
      </div>
    </>
  );
}