"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { IPartnerTransaction } from "@/types/partner";

const emptySubscribe = () => () => {};

const TYPE_LABELS: Record<string, string> = {
  CASH_DRAWING: "Cash Drawing",
  BANK_DRAWING: "Bank Drawing",
  HOUSEHOLD_EXPENSE: "Household Bill",
  CAPITAL_INJECTION: "Capital Injection",
  PROFIT_DISTRIBUTION: "Profit Distribution",
};

interface Props {
  transaction: IPartnerTransaction;
  currencySymbol: string;
  shop: { name: string; phone?: string | null; address?: string | null };
  branchName: string;
}

export default function DrawingVoucherPdf({
  transaction,
  currencySymbol,
  shop,
  branchName,
}: Props) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted) return null;

  const isInjection = transaction.type === "CAPITAL_INJECTION";
  const title =
    transaction.type === "CAPITAL_INJECTION"
      ? "Partner Capital Injection Voucher"
      : transaction.type === "HOUSEHOLD_EXPENSE"
        ? "Partner Household Bill Voucher"
        : transaction.type === "PROFIT_DISTRIBUTION"
          ? "Partner Profit Distribution Voucher"
          : "Partner Drawing Voucher";

  return createPortal(
    <div id="drawing-voucher-pdf" className="font-sans text-xs text-black">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            #drawing-voucher-pdf { display: none; }
            @media print {
              @page {
                size: A4 portrait;
                margin: 10mm !important;
              }
              html, body {
                background: white !important;
                color: black !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              body > *:not(#drawing-voucher-pdf) { display: none !important; }
              #drawing-voucher-pdf {
                display: block !important;
                position: static !important;
                width: 100% !important;
              }
            }
          `,
        }}
      />

      <div className="flex justify-between items-start border-b-2 border-black pb-2">
        <div>
          <h1 className="text-base font-black uppercase">{shop.name}</h1>
          <p className="text-[11px] font-bold">Branch: {branchName}</p>
          {shop.phone && <p className="text-[10px]">{shop.phone}</p>}
          {shop.address && <p className="text-[10px]">{shop.address}</p>}
        </div>
        <div className="text-right text-[10px]">
          <h2 className="text-sm font-black uppercase">{title}</h2>
          <p className="font-bold">Voucher #: {transaction.voucherNo}</p>
          <p>Date: {format(new Date(transaction.transactionDate), "dd MMM yyyy")}</p>
          <p>Printed: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <table className="w-full border-collapse border border-neutral-400 text-[10px] my-4">
        <tbody>
          <tr>
            <td className="border border-neutral-400 p-2 bg-neutral-100 font-bold w-1/3">Partner</td>
            <td className="border border-neutral-400 p-2">{transaction.partnerName || "—"}</td>
          </tr>
          <tr>
            <td className="border border-neutral-400 p-2 bg-neutral-100 font-bold">Transaction Type</td>
            <td className="border border-neutral-400 p-2">{TYPE_LABELS[transaction.type] || transaction.type}</td>
          </tr>
          <tr>
            <td className="border border-neutral-400 p-2 bg-neutral-100 font-bold">Purpose</td>
            <td className="border border-neutral-400 p-2">{transaction.purpose || "—"}</td>
          </tr>
          <tr>
            <td className="border border-neutral-400 p-2 bg-neutral-100 font-bold">Source Account</td>
            <td className="border border-neutral-400 p-2">{transaction.accountName || "—"}</td>
          </tr>
          <tr>
            <td className="border border-neutral-400 p-2 bg-neutral-100 font-bold">Payment Method</td>
            <td className="border border-neutral-400 p-2">{transaction.paymentMethod}</td>
          </tr>
          <tr>
            <td className="border border-neutral-400 p-2 bg-neutral-100 font-bold">Notes</td>
            <td className="border border-neutral-400 p-2">{transaction.notes || "—"}</td>
          </tr>
          <tr>
            <td className="border border-neutral-400 p-2 bg-neutral-100 font-bold">Amount</td>
            <td className="border border-neutral-400 p-2 font-mono font-black text-[13px]">
              {isInjection ? "+" : "-"}{currencySymbol}{Number(transaction.amount).toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="mt-10 flex justify-between pt-3 border-t border-neutral-400 text-[9px]">
        <div className="text-center w-36 border-t border-black pt-1">Paid By</div>
        <div className="text-center w-36 border-t border-black pt-1">Partner Signature</div>
        <div className="text-center w-36 border-t border-black pt-1">Manager</div>
      </div>
    </div>,
    document.body
  );
}
