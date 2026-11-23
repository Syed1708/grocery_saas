"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { IFamilyReportData } from "@/types/partner";

const emptySubscribe = () => () => {};

interface Props {
  data: IFamilyReportData;
  currencySymbol: string;
  shop: { name: string; phone?: string | null; address?: string | null };
  branchName: string;
  periodLabel: string;
  section: FamilyPdfSection;
}

export type FamilyPdfSection = "all" | "partners" | "transactions" | "rations";

const SECTION_TITLES: Record<FamilyPdfSection, string> = {
  all: "Family Ledger Report",
  partners: "Partner Equity Summary",
  transactions: "Drawings, Bills & Capital",
  rations: "Home Groceries",
};

const RELATIONSHIP_LABELS: Record<string, string> = {
  FATHER: "Father",
  UNCLE: "Uncle",
  BROTHER: "Brother",
  SELF: "Self",
  OTHER: "Partner",
};

const TRANSACTION_LABELS: Record<string, string> = {
  CASH_DRAWING: "Cash Drawing",
  BANK_DRAWING: "Bank Drawing",
  HOUSEHOLD_EXPENSE: "Household Bill",
  CAPITAL_INJECTION: "Capital Injection",
  PROFIT_DISTRIBUTION: "Profit Distribution",
};

export default function FamilyReportPdf({
  data,
  currencySymbol,
  shop,
  branchName,
  periodLabel,
  section,
}: Props) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted) return null;

  return createPortal(
    <div id="family-pdf-report" className="font-sans text-xs text-black">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            #family-pdf-report { display: none; }
            @media print {
              @page {
                size: A4 landscape;
                margin: 8mm !important;
              }
              html, body {
                background: white !important;
                color: black !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              body > *:not(#family-pdf-report) { display: none !important; }
              #family-pdf-report {
                display: block !important;
                position: static !important;
                width: 100% !important;
              }
              .family-print-table { page-break-inside: auto; }
              .family-print-table tr { page-break-inside: avoid; }
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
            <h2 className="text-sm font-black uppercase">{SECTION_TITLES[section]}</h2>
            <p>Period: {periodLabel}</p>
            <p>Printed: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* KPIs */}
        <table className="w-full border-collapse border border-neutral-400 text-[10px] my-2">
          <tbody>
            <tr>
              <td className="border border-neutral-400 p-1 text-center">
                <span className="block text-[8px] uppercase font-bold">Opening Capital</span>
                <strong>{currencySymbol}{data.kpis.openingCapital.toFixed(2)}</strong>
              </td>
              <td className="border border-neutral-400 p-1 text-center">
                <span className="block text-[8px] uppercase font-bold">Injected</span>
                <strong>{currencySymbol}{data.kpis.injections.toFixed(2)}</strong>
              </td>
              <td className="border border-neutral-400 p-1 text-center">
                <span className="block text-[8px] uppercase font-bold">Drawings & Bills</span>
                <strong>{currencySymbol}{data.kpis.drawings.toFixed(2)}</strong>
              </td>
              <td className="border border-neutral-400 p-1 text-center">
                <span className="block text-[8px] uppercase font-bold">Home Groceries</span>
                <strong>{currencySymbol}{data.kpis.rations.toFixed(2)}</strong>
              </td>
              <td className="border border-neutral-400 p-1 text-center">
                <span className="block text-[8px] uppercase font-bold">Net Equity</span>
                <strong>{currencySymbol}{data.kpis.netEquity.toFixed(2)}</strong>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Partner equity */}
        {(section === "all" || section === "partners") && (
          <>
            <h3 className="font-bold text-[11px] uppercase mt-3 mb-1">Partner Equity Summary</h3>
            <table className="family-print-table w-full border-collapse border border-neutral-400 text-[9px]">
          <thead>
            <tr className="bg-neutral-200 font-bold">
              <th className="border border-neutral-400 p-1 text-left">Partner</th>
              <th className="border border-neutral-400 p-1">Relation</th>
              <th className="border border-neutral-400 p-1 text-right">Equity %</th>
              <th className="border border-neutral-400 p-1 text-right">Opening</th>
              <th className="border border-neutral-400 p-1 text-right">Injected</th>
              <th className="border border-neutral-400 p-1 text-right">Drawings</th>
              <th className="border border-neutral-400 p-1 text-right">Groceries</th>
              <th className="border border-neutral-400 p-1 text-right">Net Equity</th>
            </tr>
          </thead>
          <tbody>
            {data.partners.map((p) => (
              <tr key={p.id}>
                <td className="border border-neutral-400 p-1">{p.name}</td>
                <td className="border border-neutral-400 p-1">{RELATIONSHIP_LABELS[p.relationship] || p.relationship}</td>
                <td className="border border-neutral-400 p-1 text-right">{p.equityPercent}%</td>
                <td className="border border-neutral-400 p-1 text-right">{currencySymbol}{p.openingCapital.toFixed(2)}</td>
                <td className="border border-neutral-400 p-1 text-right">{currencySymbol}{p.injections.toFixed(2)}</td>
                <td className="border border-neutral-400 p-1 text-right">{currencySymbol}{p.drawings.toFixed(2)}</td>
                <td className="border border-neutral-400 p-1 text-right">{currencySymbol}{p.rations.toFixed(2)}</td>
                <td className="border border-neutral-400 p-1 text-right font-bold">{currencySymbol}{p.netEquity.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
          </>
        )}

        {/* Transactions */}
        {(section === "all" || section === "transactions") && (
          <>
            <h3 className="font-bold text-[11px] uppercase mt-3 mb-1">
              Drawings, Bills & Capital ({data.transactions.length})
            </h3>
            <table className="family-print-table w-full border-collapse border border-neutral-400 text-[9px]">
          <thead>
            <tr className="bg-neutral-200 font-bold">
              <th className="border border-neutral-400 p-1 text-left">Voucher</th>
              <th className="border border-neutral-400 p-1 text-left">Date</th>
              <th className="border border-neutral-400 p-1 text-left">Partner</th>
              <th className="border border-neutral-400 p-1 text-left">Type</th>
              <th className="border border-neutral-400 p-1 text-left">Purpose</th>
              <th className="border border-neutral-400 p-1 text-left">Account</th>
              <th className="border border-neutral-400 p-1 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.transactions.map((t) => (
              <tr key={t.id}>
                <td className="border border-neutral-400 p-1">{t.voucherNo}</td>
                <td className="border border-neutral-400 p-1">{new Date(t.transactionDate).toLocaleDateString()}</td>
                <td className="border border-neutral-400 p-1">{t.partnerName}</td>
                <td className="border border-neutral-400 p-1">{TRANSACTION_LABELS[t.type] || t.type}</td>
                <td className="border border-neutral-400 p-1">{t.purpose || "—"}</td>
                <td className="border border-neutral-400 p-1">{t.accountName || "—"}</td>
                <td className="border border-neutral-400 p-1 text-right font-bold">
                  {t.type === "CAPITAL_INJECTION" ? "+" : "-"}{currencySymbol}{t.amount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
          </>
        )}

        {/* Rations */}
        {(section === "all" || section === "rations") && (
          <>
            <h3 className="font-bold text-[11px] uppercase mt-3 mb-1">
              Home Groceries ({data.rations.length})
            </h3>
            <table className="family-print-table w-full border-collapse border border-neutral-400 text-[9px]">
          <thead>
            <tr className="bg-neutral-200 font-bold">
              <th className="border border-neutral-400 p-1 text-left">Ration #</th>
              <th className="border border-neutral-400 p-1 text-left">Date</th>
              <th className="border border-neutral-400 p-1 text-left">Partner</th>
              <th className="border border-neutral-400 p-1 text-left">Items</th>
              <th className="border border-neutral-400 p-1 text-right">Total Cost</th>
            </tr>
          </thead>
          <tbody>
            {data.rations.map((r) => (
              <tr key={r.id}>
                <td className="border border-neutral-400 p-1">{r.rationNo}</td>
                <td className="border border-neutral-400 p-1">{new Date(r.rationDate).toLocaleDateString()}</td>
                <td className="border border-neutral-400 p-1">{r.partnerName}</td>
                <td className="border border-neutral-400 p-1">
                  {r.items.map((it) => `${it.productName} × ${it.quantity}`).join(", ")}
                </td>
                <td className="border border-neutral-400 p-1 text-right font-bold">
                  {currencySymbol}{r.totalCost.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
          </>
        )}

        <div className="mt-10 flex justify-between pt-3 border-t border-neutral-400 text-[9px]">
          <div className="text-center w-36 border-t border-black pt-1">Accountant</div>
          <div className="text-center w-36 border-t border-black pt-1">Manager</div>
          <div className="text-center w-36 border-t border-black pt-1">Owner</div>
        </div>
    </div>,
    document.body
  );
}
