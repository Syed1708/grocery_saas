"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import {
  IFamilyReportData,
  IFamilyReportPartnerRow,
  IPartnerRation,
  IPartnerTransaction,
} from "@/types/partner";

const emptySubscribe = () => () => {};

export type PartnerGroupBy = "daily" | "monthly" | "yearly";
export type PartnerStatementType = "all" | "drawings" | "rations";

const GROUP_LABELS: Record<PartnerGroupBy, string> = {
  daily: "Daily",
  monthly: "Monthly",
  yearly: "Yearly",
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

interface Props {
  data: IFamilyReportData;
  partner: IFamilyReportPartnerRow;
  currencySymbol: string;
  shop: { name: string; phone?: string | null; address?: string | null };
  branchName: string;
  periodLabel: string;
  groupBy: PartnerGroupBy;
  statementType: PartnerStatementType;
}

interface PeriodRow {
  key: string;
  label: string;
  injections: number;
  drawings: number;
  rations: number;
}

function periodKey(date: Date, groupBy: PartnerGroupBy): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  if (groupBy === "yearly") return String(year);
  if (groupBy === "monthly") return `${year}-${month}`;
  return `${year}-${month}-${day}`;
}

function periodLabel(date: Date, groupBy: PartnerGroupBy): string {
  if (groupBy === "yearly") return format(date, "yyyy");
  if (groupBy === "monthly") return format(date, "MMM yyyy");
  return format(date, "dd MMM yyyy");
}

export default function PartnerStatementPdf({
  data,
  partner,
  currencySymbol,
  shop,
  branchName,
  periodLabel: reportPeriodLabel,
  groupBy,
  statementType,
}: Props) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const transactions: IPartnerTransaction[] = data.transactions
    .filter(
      (transaction) =>
        transaction.partnerId === partner.id &&
        statementType !== "rations" &&
        (statementType !== "drawings" || transaction.type !== "CAPITAL_INJECTION")
    )
    .sort(
      (a, b) =>
        new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
    );

  const rations: IPartnerRation[] = data.rations
    .filter((ration) => statementType !== "drawings" && ration.partnerId === partner.id)
    .sort(
      (a, b) => new Date(a.rationDate).getTime() - new Date(b.rationDate).getTime()
    );

  const periodMap = new Map<string, PeriodRow>();
  const addPeriod = (date: Date, update: (row: PeriodRow) => void) => {
    const key = periodKey(date, groupBy);
    const existing =
      periodMap.get(key) ||
      ({ key, label: periodLabel(date, groupBy), injections: 0, drawings: 0, rations: 0 } as PeriodRow);
    update(existing);
    periodMap.set(key, existing);
  };

  let totalInjections = 0;
  let totalDrawings = 0;
  let totalRations = 0;

  for (const transaction of transactions) {
    const amount = Number(transaction.amount);
    const isInjection = transaction.type === "CAPITAL_INJECTION";
    if (isInjection) totalInjections += amount;
    else totalDrawings += amount;

    addPeriod(new Date(transaction.transactionDate), (row) => {
      if (isInjection) row.injections += amount;
      else row.drawings += amount;
    });
  }

  for (const ration of rations) {
    const amount = Number(ration.totalCost);
    totalRations += amount;
    addPeriod(new Date(ration.rationDate), (row) => {
      row.rations += amount;
    });
  }

  const periodRows = Array.from(periodMap.values()).sort((a, b) =>
    a.key.localeCompare(b.key)
  );
  const totalUsage = totalDrawings + totalRations;
  const netMovement = totalInjections - totalUsage;
  const showCapital = statementType === "all";
  const showDrawings = statementType !== "rations";
  const showGroceries = statementType !== "drawings";
  const summaryColumns =
    2 + (showCapital ? 1 : 0) + (showDrawings ? 1 : 0) + (showGroceries ? 1 : 0) +
    (showDrawings && showGroceries ? 1 : 0);
  const statementTitle =
    statementType === "drawings"
      ? "Partner Drawings & Bills Statement"
      : statementType === "rations"
        ? "Partner Home Groceries Statement"
        : "Partner Statement";

  if (!mounted) return null;

  return createPortal(
    <div id="partner-statement-pdf" className="font-sans text-xs text-black">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            #partner-statement-pdf { display: none; }
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
              body > *:not(#partner-statement-pdf) { display: none !important; }
              #partner-statement-pdf {
                display: block !important;
                position: static !important;
                width: 100% !important;
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
              .partner-print-table { page-break-inside: auto; }
              .partner-print-table thead { display: table-header-group; }
              .partner-print-table tr { page-break-inside: avoid; }
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
          <h2 className="text-sm font-black uppercase">{statementTitle}</h2>
          <p className="font-bold">{partner.name}</p>
          <p>{RELATIONSHIP_LABELS[partner.relationship] || partner.relationship} • {partner.equityPercent}% equity</p>
          <p>Period: {reportPeriodLabel}</p>
          <p>Printed: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <table className="w-full border-collapse border border-neutral-400 text-[10px] my-2">
        <tbody>
          <tr>
            {statementType === "rations" ? (
              <>
                <td className="border border-neutral-400 p-1 text-center">
                  <span className="block text-[8px] uppercase font-bold">Home Groceries</span>
                  <strong>{currencySymbol}{totalRations.toFixed(2)}</strong>
                </td>
                <td className="border border-neutral-400 p-1 text-center">
                  <span className="block text-[8px] uppercase font-bold">Ration Invoices</span>
                  <strong>{rations.length}</strong>
                </td>
                <td className="border border-neutral-400 p-1 text-center">
                  <span className="block text-[8px] uppercase font-bold">Net Movement</span>
                  <strong>-{currencySymbol}{totalRations.toFixed(2)}</strong>
                </td>
              </>
            ) : statementType === "drawings" ? (
              <>
                <td className="border border-neutral-400 p-1 text-center">
                  <span className="block text-[8px] uppercase font-bold">Drawings & Bills</span>
                  <strong>{currencySymbol}{totalDrawings.toFixed(2)}</strong>
                </td>
                <td className="border border-neutral-400 p-1 text-center">
                  <span className="block text-[8px] uppercase font-bold">Vouchers</span>
                  <strong>{transactions.length}</strong>
                </td>
                <td className="border border-neutral-400 p-1 text-center">
                  <span className="block text-[8px] uppercase font-bold">Net Movement</span>
                  <strong>-{currencySymbol}{totalDrawings.toFixed(2)}</strong>
                </td>
              </>
            ) : (
              <>
                <td className="border border-neutral-400 p-1 text-center">
                  <span className="block text-[8px] uppercase font-bold">Capital Injected</span>
                  <strong>{currencySymbol}{totalInjections.toFixed(2)}</strong>
                </td>
                <td className="border border-neutral-400 p-1 text-center">
                  <span className="block text-[8px] uppercase font-bold">Drawings & Bills</span>
                  <strong>{currencySymbol}{totalDrawings.toFixed(2)}</strong>
                </td>
                <td className="border border-neutral-400 p-1 text-center">
                  <span className="block text-[8px] uppercase font-bold">Home Groceries</span>
                  <strong>{currencySymbol}{totalRations.toFixed(2)}</strong>
                </td>
                <td className="border border-neutral-400 p-1 text-center">
                  <span className="block text-[8px] uppercase font-bold">Total Usage</span>
                  <strong>{currencySymbol}{totalUsage.toFixed(2)}</strong>
                </td>
                <td className="border border-neutral-400 p-1 text-center">
                  <span className="block text-[8px] uppercase font-bold">Net Movement</span>
                  <strong>{netMovement >= 0 ? "+" : ""}{currencySymbol}{netMovement.toFixed(2)}</strong>
                </td>
              </>
            )}
          </tr>
        </tbody>
      </table>

      <h3 className="font-bold text-[11px] uppercase mt-3 mb-1">
        {GROUP_LABELS[groupBy]} Summary
      </h3>
      <table className="partner-print-table w-full border-collapse border border-neutral-400 text-[9px]">
        <thead>
          <tr className="bg-neutral-200 font-bold">
            <th className="border border-neutral-400 p-1 text-left">Period</th>
            {showCapital && <th className="border border-neutral-400 p-1 text-right">Capital In</th>}
            {showDrawings && <th className="border border-neutral-400 p-1 text-right">Drawings & Bills</th>}
            {showGroceries && <th className="border border-neutral-400 p-1 text-right">Home Groceries</th>}
            {showDrawings && showGroceries && <th className="border border-neutral-400 p-1 text-right">Total Usage</th>}
            <th className="border border-neutral-400 p-1 text-right">Net Movement</th>
          </tr>
        </thead>
        <tbody>
          {periodRows.length === 0 ? (
            <tr>
              <td colSpan={summaryColumns} className="border border-neutral-400 p-2 text-center">
                No activity in this period.
              </td>
            </tr>
          ) : (
            periodRows.map((row) => {
              const usage = row.drawings + row.rations;
              const net = showCapital
                ? row.injections - usage
                : -((showDrawings ? row.drawings : 0) + (showGroceries ? row.rations : 0));
              return (
                <tr key={row.key}>
                  <td className="border border-neutral-400 p-1">{row.label}</td>
                  {showCapital && <td className="border border-neutral-400 p-1 text-right">{currencySymbol}{row.injections.toFixed(2)}</td>}
                  {showDrawings && <td className="border border-neutral-400 p-1 text-right">{currencySymbol}{row.drawings.toFixed(2)}</td>}
                  {showGroceries && <td className="border border-neutral-400 p-1 text-right">{currencySymbol}{row.rations.toFixed(2)}</td>}
                  {showDrawings && showGroceries && <td className="border border-neutral-400 p-1 text-right font-bold">{currencySymbol}{usage.toFixed(2)}</td>}
                  <td className="border border-neutral-400 p-1 text-right font-bold">{net >= 0 ? "+" : ""}{currencySymbol}{net.toFixed(2)}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {showDrawings && (
        <>
      <h3 className="font-bold text-[11px] uppercase mt-3 mb-1">
        {statementType === "drawings" ? "Drawings & Bills" : "Drawings, Bills & Capital"} ({transactions.length})
      </h3>
      <table className="partner-print-table w-full border-collapse border border-neutral-400 text-[9px]">
        <thead>
          <tr className="bg-neutral-200 font-bold">
            <th className="border border-neutral-400 p-1 text-left">Date</th>
            <th className="border border-neutral-400 p-1 text-left">Voucher</th>
            <th className="border border-neutral-400 p-1 text-left">Type</th>
            <th className="border border-neutral-400 p-1 text-left">Purpose</th>
            <th className="border border-neutral-400 p-1 text-left">Account</th>
            <th className="border border-neutral-400 p-1 text-left">Method</th>
            <th className="border border-neutral-400 p-1 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 ? (
            <tr>
              <td colSpan={7} className="border border-neutral-400 p-2 text-center">
                No drawings or bills in this period.
              </td>
            </tr>
          ) : (
            transactions.map((transaction) => {
              const isInjection = transaction.type === "CAPITAL_INJECTION";
              return (
                <tr key={transaction.id}>
                  <td className="border border-neutral-400 p-1">{format(new Date(transaction.transactionDate), "dd MMM yyyy")}</td>
                  <td className="border border-neutral-400 p-1">{transaction.voucherNo}</td>
                  <td className="border border-neutral-400 p-1">{TRANSACTION_LABELS[transaction.type] || transaction.type}</td>
                  <td className="border border-neutral-400 p-1">{transaction.purpose || "—"}</td>
                  <td className="border border-neutral-400 p-1">{transaction.accountName || "—"}</td>
                  <td className="border border-neutral-400 p-1">{transaction.paymentMethod}</td>
                  <td className="border border-neutral-400 p-1 text-right font-bold">
                    {isInjection ? "+" : "-"}{currencySymbol}{Number(transaction.amount).toFixed(2)}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
        </>
      )}

      {showGroceries && (
        <>
      <h3 className="font-bold text-[11px] uppercase mt-3 mb-1">
        Home Groceries ({rations.length})
      </h3>
      <table className="partner-print-table w-full border-collapse border border-neutral-400 text-[9px]">
        <thead>
          <tr className="bg-neutral-200 font-bold">
            <th className="border border-neutral-400 p-1 text-left">Date</th>
            <th className="border border-neutral-400 p-1 text-left">Ration #</th>
            <th className="border border-neutral-400 p-1 text-left">Items</th>
            <th className="border border-neutral-400 p-1 text-right">Total Cost</th>
          </tr>
        </thead>
        <tbody>
          {rations.length === 0 ? (
            <tr>
              <td colSpan={4} className="border border-neutral-400 p-2 text-center">
                No home groceries in this period.
              </td>
            </tr>
          ) : (
            rations.map((ration) => (
              <tr key={ration.id}>
                <td className="border border-neutral-400 p-1">{format(new Date(ration.rationDate), "dd MMM yyyy")}</td>
                <td className="border border-neutral-400 p-1">{ration.rationNo}</td>
                <td className="border border-neutral-400 p-1">
                  {ration.items
                    .map(
                      (item) =>
                        `${item.productName} × ${item.quantity}${item.unitName ? ` ${item.unitName}` : ""} (${currencySymbol}${item.lineTotal.toFixed(2)})`
                    )
                    .join("; ")}
                </td>
                <td className="border border-neutral-400 p-1 text-right font-bold">
                  {currencySymbol}{Number(ration.totalCost).toFixed(2)}
                </td>
              </tr>
            ))
          )}
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
