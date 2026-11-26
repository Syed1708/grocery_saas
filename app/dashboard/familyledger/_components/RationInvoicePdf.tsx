"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { IPartnerRation } from "@/types/partner";

const emptySubscribe = () => () => {};

interface Props {
  ration: IPartnerRation;
  currencySymbol: string;
  shop: { name: string; phone?: string | null; address?: string | null };
  branchName: string;
}

export default function RationInvoicePdf({
  ration,
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

  const totalQuantity = ration.items.reduce((sum, item) => sum + Number(item.quantity), 0);

  return createPortal(
    <div id="ration-invoice-pdf" className="font-sans text-xs text-black">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            #ration-invoice-pdf { display: none; }
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
              body > *:not(#ration-invoice-pdf) { display: none !important; }
              #ration-invoice-pdf {
                display: block !important;
                position: static !important;
                width: 100% !important;
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
              .ration-print-table { page-break-inside: auto; }
              .ration-print-table thead { display: table-header-group; }
              .ration-print-table tr { page-break-inside: avoid; }
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
          <h2 className="text-sm font-black uppercase">Home Grocery Ration Invoice</h2>
          <p className="font-bold">Ration #: {ration.rationNo}</p>
          <p>Date: {format(new Date(ration.rationDate), "dd MMM yyyy")}</p>
          <p>Printed: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 my-3 text-[10px]">
        <div className="border border-neutral-400 p-2">
          <p className="text-[8px] uppercase font-bold text-neutral-500">Issued To (Partner)</p>
          <p className="font-bold text-[11px]">{ration.partnerName || "—"}</p>
        </div>
        <div className="border border-neutral-400 p-2">
          <p className="text-[8px] uppercase font-bold text-neutral-500">Notes / Purpose</p>
          <p>{ration.notes || "—"}</p>
        </div>
      </div>

      <table className="ration-print-table w-full border-collapse border border-neutral-400 text-[9px]">
        <thead>
          <tr className="bg-neutral-200 font-bold">
            <th className="border border-neutral-400 p-1 text-left">#</th>
            <th className="border border-neutral-400 p-1 text-left">Product</th>
            <th className="border border-neutral-400 p-1 text-right">Quantity</th>
            <th className="border border-neutral-400 p-1 text-left">Unit</th>
            <th className="border border-neutral-400 p-1 text-right">Unit Cost</th>
            <th className="border border-neutral-400 p-1 text-right">Line Total</th>
          </tr>
        </thead>
        <tbody>
          {ration.items.map((item, index) => (
            <tr key={item.id}>
              <td className="border border-neutral-400 p-1">{index + 1}</td>
              <td className="border border-neutral-400 p-1">{item.productName}</td>
              <td className="border border-neutral-400 p-1 text-right">{Number(item.quantity).toFixed(2)}</td>
              <td className="border border-neutral-400 p-1">{item.unitName || "—"}</td>
              <td className="border border-neutral-400 p-1 text-right">{currencySymbol}{Number(item.unitCost).toFixed(2)}</td>
              <td className="border border-neutral-400 p-1 text-right font-bold">{currencySymbol}{Number(item.lineTotal).toFixed(2)}</td>
            </tr>
          ))}
          {ration.items.length === 0 && (
            <tr>
              <td colSpan={6} className="border border-neutral-400 p-2 text-center">
                No items in this ration.
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className="bg-neutral-100 font-bold">
            <td colSpan={2} className="border border-neutral-400 p-1 text-right">Total</td>
            <td className="border border-neutral-400 p-1 text-right">{totalQuantity.toFixed(2)}</td>
            <td className="border border-neutral-400 p-1" />
            <td className="border border-neutral-400 p-1" />
            <td className="border border-neutral-400 p-1 text-right">{currencySymbol}{Number(ration.totalCost).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <div className="mt-3 text-[9px] border border-neutral-400 p-2">
        <span className="font-bold">Total grocery cost (at purchase price): </span>
        <span className="font-mono font-black">{currencySymbol}{Number(ration.totalCost).toFixed(2)}</span>
      </div>

      <div className="mt-12 flex justify-between pt-3 border-t border-neutral-400 text-[9px]">
        <div className="text-center w-36 border-t border-black pt-1">Issued By</div>
        <div className="text-center w-36 border-t border-black pt-1">Partner Signature</div>
        <div className="text-center w-36 border-t border-black pt-1">Manager</div>
      </div>
    </div>,
    document.body
  );
}
