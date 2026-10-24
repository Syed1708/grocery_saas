"use client";

import { ISalesReportKPIs, ISaleReportRow, ISalesFilterParams } from "@/types/index";

interface Props {
  kpis: ISalesReportKPIs;
  invoices: ISaleReportRow[];
  currencySymbol: string;
  filters: ISalesFilterParams;
  shop: {
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    binVatNumber?: string | null;
    tradeLicense?: string | null;
  };
  branchName: string;
}

export default function SalesReportPdfDocument({
  kpis,
  invoices,
  currencySymbol,
  filters,
  shop,
  branchName,
}: Props) {
  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const dateRangeLabel =
    filters.startDate && filters.endDate
      ? `${filters.startDate} to ${filters.endDate}`
      : filters.startDate
      ? `From ${filters.startDate}`
      : filters.endDate
      ? `Up to ${filters.endDate}`
      : "All Available Records";

  return (
    <>
{/* Strict A4 Print-to-PDF CSS: Strips out localhost URL & browser headers */}
<style dangerouslySetInnerHTML={{ __html: `
  @media print {
    @page {
      size: A4 portrait;
      margin: 0 !important; /* Suppresses browser URL headers & footers */
    }
    body {
      background: #ffffff !important;
      color: #000000 !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    body * {
      visibility: hidden !important;
    }
    #sales-pdf-report, #sales-pdf-report * {
      visibility: visible !important;
    }
    #sales-pdf-report {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      width: 100% !important;
      display: block !important;
      padding: 12mm 15mm !important; /* Natural internal page margins */
      box-sizing: border-box !important;
    }
  }
`}} />

      {/* A4 Report Sheet (Hidden on screen, Visible in Print/PDF) */}
      <div id="sales-pdf-report" className="hidden print:block font-sans text-black text-xs leading-normal">
        {/* Company Letterhead */}
        <div className="flex justify-between items-start pb-3 border-b-2 border-black">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight">{shop.name}</h1>
            <p className="text-xs font-semibold text-neutral-800">Branch: {branchName}</p>
            {shop.address && <p className="text-[11px] text-neutral-600">{shop.address}</p>}
            <p className="text-[11px] text-neutral-600">
              {shop.phone && <span>Phone: {shop.phone} </span>}
              {shop.email && <span>| Email: {shop.email}</span>}
            </p>
          </div>

          <div className="text-right text-[11px]">
            {shop.binVatNumber && <p><strong>BIN / VAT:</strong> {shop.binVatNumber}</p>}
            {shop.tradeLicense && <p><strong>Trade License:</strong> {shop.tradeLicense}</p>}
            <p className="text-neutral-500 mt-1">Generated: {currentDate} {currentTime}</p>
          </div>
        </div>

        {/* Report Metadata Banner */}
        <div className="my-3 py-1.5 px-3 bg-neutral-100 flex justify-between items-center rounded border border-neutral-300">
          <div>
            <span className="font-bold text-xs uppercase tracking-wide">Sales & Revenue Audit Report</span>
          </div>
          <div className="text-[11px]">
            <span className="font-medium text-neutral-600">Period: </span>
            <span className="font-bold font-mono">{dateRangeLabel}</span>
          </div>
        </div>

        {/* Financial KPI Summary Grid */}
        <div className="grid grid-cols-4 gap-2 mb-4 text-center">
          <div className="p-2 border border-neutral-300 rounded bg-neutral-50">
            <span className="block text-[10px] uppercase text-neutral-500 font-semibold">Total Net Sales</span>
            <span className="text-sm font-bold font-mono">{currencySymbol}{kpis.totalNetSales.toFixed(2)}</span>
          </div>
          <div className="p-2 border border-neutral-300 rounded bg-neutral-50">
            <span className="block text-[10px] uppercase text-neutral-500 font-semibold">Cash Collected</span>
            <span className="text-sm font-bold font-mono">{currencySymbol}{kpis.totalCashCollected.toFixed(2)}</span>
          </div>
          <div className="p-2 border border-neutral-300 rounded bg-neutral-50">
            <span className="block text-[10px] uppercase text-neutral-500 font-semibold">Outstanding Dues</span>
            <span className="text-sm font-bold font-mono">{currencySymbol}{kpis.totalDueOutstanding.toFixed(2)}</span>
          </div>
          <div className="p-2 border border-neutral-300 rounded bg-neutral-50">
            <span className="block text-[10px] uppercase text-neutral-500 font-semibold">Total Invoices</span>
            <span className="text-sm font-bold font-mono">{kpis.totalInvoices}</span>
          </div>
        </div>

        {/* Granular Invoices Table */}
        <div className="mb-6">
          <table className="w-full text-left border-collapse border border-neutral-300 text-[10px]">
            <thead>
              <tr className="bg-neutral-100 font-bold border-b border-neutral-300">
                <th className="p-1.5 border-r border-neutral-300">#</th>
                <th className="p-1.5 border-r border-neutral-300">Invoice No</th>
                <th className="p-1.5 border-r border-neutral-300">Date</th>
                <th className="p-1.5 border-r border-neutral-300">Customer</th>
                <th className="p-1.5 border-r border-neutral-300">Method</th>
                <th className="p-1.5 text-right border-r border-neutral-300">Grand Total</th>
                <th className="p-1.5 text-right border-r border-neutral-300">Paid</th>
                <th className="p-1.5 text-right">Due</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, idx) => (
                <tr key={inv.id} className="border-b border-neutral-200">
                  <td className="p-1.5 border-r border-neutral-200 font-mono text-neutral-500">{idx + 1}</td>
                  <td className="p-1.5 border-r border-neutral-200 font-mono font-semibold">{inv.invoiceNo}</td>
                  <td className="p-1.5 border-r border-neutral-200">{new Date(inv.saleDate).toLocaleDateString()}</td>
                  <td className="p-1.5 border-r border-neutral-200">{inv.customerName}</td>
                  <td className="p-1.5 border-r border-neutral-200 uppercase font-mono">{inv.paymentMethod}</td>
                  <td className="p-1.5 text-right border-r border-neutral-200 font-mono font-semibold">
                    {currencySymbol}{inv.grandTotal.toFixed(2)}
                  </td>
                  <td className="p-1.5 text-right border-r border-neutral-200 font-mono">
                    {currencySymbol}{inv.paidAmount.toFixed(2)}
                  </td>
                  <td className="p-1.5 text-right font-mono font-semibold">
                    {inv.dueAmount > 0 ? `${currencySymbol}${inv.dueAmount.toFixed(2)}` : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-neutral-100 font-bold border-t border-black text-[11px]">
                <td colSpan={5} className="p-2 text-right border-r border-neutral-300">Summary Totals:</td>
                <td className="p-2 text-right border-r border-neutral-300 font-mono">
                  {currencySymbol}{kpis.totalNetSales.toFixed(2)}
                </td>
                <td className="p-2 text-right border-r border-neutral-300 font-mono">
                  {currencySymbol}{kpis.totalCashCollected.toFixed(2)}
                </td>
                <td className="p-2 text-right font-mono">
                  {currencySymbol}{kpis.totalDueOutstanding.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Formal Signature Footers */}
        <div className="mt-16 flex justify-between items-end text-[10px] pt-4 border-t border-neutral-300">
          <div className="text-center w-36">
            <div className="border-t border-black pt-1 font-semibold">Prepared By</div>
            <span className="text-[9px] text-neutral-500">Accountant / Cashier</span>
          </div>
          <div className="text-center w-36">
            <div className="border-t border-black pt-1 font-semibold">Verified By</div>
            <span className="text-[9px] text-neutral-500">Store Manager</span>
          </div>
          <div className="text-center w-36">
            <div className="border-t border-black pt-1 font-semibold">Authorized Signature</div>
            <span className="text-[9px] text-neutral-500">Proprietor / Director</span>
          </div>
        </div>
      </div>
    </>
  );
}