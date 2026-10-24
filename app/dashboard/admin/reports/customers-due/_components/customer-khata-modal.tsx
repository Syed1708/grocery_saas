"use client";

import { useEffect, useState } from "react";
import FormModal from "@/components/common/FormModal";
import { ICustomerDueRow, ICustomerKhataEntry, ICustomerKhataSummary } from "@/types/index";
import { Loader2, Printer, FileText } from "lucide-react";
import { fetchCustomerKhataAction } from "@/app/actions/customer-khata-actions";

interface Props {
  customer: ICustomerDueRow | null;
  currencySymbol: string;
  shopName: string;
  onClose: () => void;
}

export default function CustomerKhataModal({
  customer,
  currencySymbol,
  shopName,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ summary: ICustomerKhataSummary; ledger: ICustomerKhataEntry[] } | null>(null);
  const [printFormat, setPrintFormat] = useState<"thermal" | "a4">("thermal");

  useEffect(() => {
    if (!customer) return;
    setLoading(true);
    fetchCustomerKhataAction(customer.id)
      .then((res) => {
        if (res.success && res.data) setData(res.data);
      })
      .finally(() => setLoading(false));
  }, [customer]);

  if (!customer) return null;

  const handlePrint = (format: "thermal" | "a4") => {
    setPrintFormat(format);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <>
      {/* Dynamic Print CSS Isolation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: ${printFormat === "thermal" ? "80mm auto" : "A4 portrait"};
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
          #print-khata-container, #print-khata-container * {
            visibility: visible !important;
          }
          #print-khata-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: ${printFormat === "thermal" ? "78mm" : "100%"} !important;
            display: block !important;
            padding: ${printFormat === "thermal" ? "6px" : "12mm 15mm"} !important;
            box-sizing: border-box !important;
          }
        }
      `}} />

      {/* Screen Modal */}
      <div className="print:hidden">
        <FormModal
          isOpen={!!customer}
          onClose={onClose}
          onSubmit={(e) => { e.preventDefault(); handlePrint("thermal"); }}
          title={`গ্রাহক বাকি খাতা: ${customer.name}`}
          description={`মোবাইল: ${customer.phone || "N/A"} | গ্রাম/এলাকা: ${customer.village || "N/A"}`}
          submitLabel="৮০মিমি স্লিপ প্রিন্ট"
          maxWidth="xl"
        >
          <div className="space-y-4">
            {/* Quick Action Bar for Prints */}
            <div className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-800/60 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700">
              <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">প্রিন্ট অপশন:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handlePrint("thermal")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 cursor-pointer"
                >
                  <Printer size={13} /> ৮০মিমি ক্যাশ রসিদ (Thermal)
                </button>
                <button
                  type="button"
                  onClick={() => handlePrint("a4")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                >
                  <FileText size={13} /> A4 ফুল স্টেটমেন্ট (A4 Sheet)
                </button>
              </div>
            </div>

            {/* Financial Summary Ribbon */}
            {data?.summary && (
              <div className="grid grid-cols-4 gap-2 p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900 text-xs">
                <div>
                  <span className="text-[10px] text-neutral-500 block">প্রারম্ভিক বাকি</span>
                  <span className="font-mono font-bold">{currencySymbol}{data.summary.openingDue.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 block">মোট মাল ক্রয়</span>
                  <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">{currencySymbol}{data.summary.totalBilled.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-600 block">মোট জমা দিয়েছেন</span>
                  <span className="font-mono font-bold text-emerald-600">{currencySymbol}{data.summary.totalPaid.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-red-600 font-bold block">বর্তমান বকেয়া পাওনা</span>
                  <span className="font-mono font-black text-sm text-red-600">{currencySymbol}{data.summary.currentDue.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Ledger Table */}
            {loading ? (
              <div className="py-12 flex justify-center items-center gap-2 text-neutral-400 text-xs">
                <Loader2 className="animate-spin" size={16} /> খাতা লোড হচ্ছে...
              </div>
            ) : (
              <div className="max-h-95 overflow-y-auto border border-neutral-200 dark:border-neutral-800 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-neutral-100 dark:bg-neutral-800 sticky top-0 font-semibold border-b border-neutral-200 dark:border-neutral-700 z-10 text-[11px]">
                    <tr>
                      <th className="p-2.5">তারিখ</th>
                      <th className="p-2.5">লেনদেন / বিবরণ</th>
                      <th className="p-2.5 text-right">মোট বিল</th>
                      <th className="p-2.5 text-right">জমা (Paid)</th>
                      <th className="p-2.5 text-right">বাকি যোগ (+)</th>
                      <th className="p-2.5 text-right">চলতি জের (Due)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!data?.ledger.length ? (
                      <tr>
                        <td colSpan={6} className="text-center p-6 text-neutral-400">কোন লেনদেন পাওয়া যায়নি।</td>
                      </tr>
                    ) : (
                      data.ledger.map((entry) => (
                        <tr key={entry.id} className="border-b border-neutral-100 dark:border-neutral-800/60 hover:bg-neutral-50/50 text-[11px]">
                          <td className="p-2.5 font-mono text-neutral-500 whitespace-nowrap">
                            {new Date(entry.date).toLocaleDateString()}
                          </td>
                          <td className="p-2.5">
                            <span className="font-semibold block text-neutral-900 dark:text-neutral-100">{entry.title}</span>
                            <span className="text-[10px] font-mono text-neutral-400">
                              {entry.referenceNo} {entry.note && `• ${entry.note}`}
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-mono text-neutral-600">
                            {entry.invoiceTotal ? `${currencySymbol}${entry.invoiceTotal.toFixed(2)}` : "-"}
                          </td>
                          <td className="p-2.5 text-right font-mono font-semibold text-emerald-600">
                            {entry.paidAtPos ? `${currencySymbol}${entry.paidAtPos.toFixed(2)}` : entry.credit > 0 ? `${currencySymbol}${entry.credit.toFixed(2)}` : "-"}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100">
                            {entry.debit > 0 ? `${currencySymbol}${entry.debit.toFixed(2)}` : "-"}
                          </td>
                          <td className="p-2.5 text-right font-mono font-black text-red-600 dark:text-red-400">
                            {currencySymbol}{entry.balance.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </FormModal>
      </div>

      {/* PRINT CONTAINER (Renders either 80mm or A4 depending on printFormat state) */}
      <div id="print-khata-container" className="hidden print:block text-black">
        {printFormat === "thermal" ? (
          /* ==================== 80MM THERMAL SLIP ==================== */
          <div className="font-mono text-[10px] leading-tight space-y-2">
            <div className="text-center pb-2 border-b border-dashed border-black">
              <h2 className="font-black text-xs uppercase">{shopName}</h2>
              <p className="font-bold text-[11px]">কাস্টমার বাকি খাতা রসিদ</p>
              <p className="text-[9px]">তারিখ: {new Date().toLocaleDateString()}</p>
            </div>

            <div className="pb-1 border-b border-dashed border-black space-y-0.5 text-[9px]">
              <p><strong>গ্রাহক:</strong> {customer.name}</p>
              {customer.phone && <p><strong>ফোন:</strong> {customer.phone}</p>}
              {customer.village && <p><strong>ঠিকানা:</strong> {customer.village}</p>}
            </div>

            <div className="py-1 border-b border-dashed border-black space-y-1">
              <div className="flex justify-between font-bold border-b border-black pb-0.5">
                <span>বিবরণ / ইনভয়েস</span>
                <span>বাকি / চলতি</span>
              </div>
              {data?.ledger.map((l) => (
                <div key={l.id} className="text-[9px] border-b border-dotted border-neutral-300 pb-0.5">
                  <div className="flex justify-between">
                    <span>{new Date(l.date).toLocaleDateString([], { month: "numeric", day: "numeric" })} {l.referenceNo}</span>
                    <span className="font-bold">
                      {l.debit > 0 ? `+${currencySymbol}${l.debit.toFixed(0)}` : l.credit > 0 ? `-${currencySymbol}${l.credit.toFixed(0)}` : "নগদ রিফান্ড"}
                    </span>
                  </div>
                  <div className="flex justify-between text-[8px] text-neutral-600">
                    <span>{l.title}</span>
                    <span>জের: {currencySymbol}{l.balance.toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="py-2 border-b-2 border-black space-y-1">
              <div className="flex justify-between font-black text-xs">
                <span>সর্বমোট বর্তমান বাকি:</span>
                <span>{currencySymbol}{customer.currentDue.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-2 text-center text-[9px]">
              <p>বকেয়া টাকা দ্রুত পরিশোধের অনুরোধ রইল।</p>
              <p className="mt-4 border-t border-black pt-1">স্বাক্ষর</p>
            </div>
          </div>
        ) : (
          /* ==================== A4 FORMAL STATEMENT ==================== */
          <div className="font-sans text-xs space-y-4">
            <div className="flex justify-between items-start border-b-2 border-black pb-3">
              <div>
                <h1 className="text-xl font-black uppercase">{shopName}</h1>
                <p className="text-xs font-bold text-neutral-800">কাস্টমার বাকি খাতা অডিট বিবরণী (Ledger Statement)</p>
              </div>
              <div className="text-right text-[10px]">
                <p>তারিখ: {new Date().toLocaleDateString()}</p>
                <p>কাস্টমার টাইপ: {customer.type === "PERMANENT" ? "স্থায়ী" : "চলতি"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-3 bg-neutral-100 border border-neutral-300 rounded text-xs">
              <div>
                <p><strong>গ্রাহকের নাম:</strong> {customer.name}</p>
                <p><strong>মোবাইল নম্বর:</strong> {customer.phone || "N/A"}</p>
                <p><strong>গ্রাম/ঠিকানা:</strong> {customer.village || customer.address || "N/A"}</p>
              </div>
              <div className="text-right">
                <p><strong>বাকি লিমিট:</strong> {currencySymbol}{customer.creditLimit.toFixed(2)}</p>
                <p className="text-sm font-bold text-red-600 mt-1">
                  সর্বমোট বর্তমান দেনা: {currencySymbol}{customer.currentDue.toFixed(2)}
                </p>
              </div>
            </div>

            <table className="w-full text-left border-collapse border border-neutral-300 text-[10px]">
              <thead>
                <tr className="bg-neutral-200 font-bold border-b border-neutral-300">
                  <th className="p-1.5 border-r border-neutral-300">তারিখ</th>
                  <th className="p-1.5 border-r border-neutral-300">ভাউচার / ইনভয়েস নং</th>
                  <th className="p-1.5 border-r border-neutral-300">লেনদেনের বিবরণী</th>
                  <th className="p-1.5 text-right border-r border-neutral-300">মোট বিল</th>
                  <th className="p-1.5 text-right border-r border-neutral-300">নগদ জমা</th>
                  <th className="p-1.5 text-right border-r border-neutral-300">বাকি বৃদ্ধি (+)</th>
                  <th className="p-1.5 text-right border-r border-neutral-300">বাকি হ্রাস (-)</th>
                  <th className="p-1.5 text-right">চলতি জের (Due)</th>
                </tr>
              </thead>
              <tbody>
                {data?.ledger.map((entry) => (
                  <tr key={entry.id} className="border-b border-neutral-200">
                    <td className="p-1.5 border-r border-neutral-200 font-mono">{new Date(entry.date).toLocaleDateString()}</td>
                    <td className="p-1.5 border-r border-neutral-200 font-mono font-semibold">{entry.referenceNo}</td>
                    <td className="p-1.5 border-r border-neutral-200">{entry.title}</td>
                    <td className="p-1.5 text-right border-r border-neutral-200 font-mono">
                      {entry.invoiceTotal ? `${currencySymbol}${entry.invoiceTotal.toFixed(2)}` : "-"}
                    </td>
                    <td className="p-1.5 text-right border-r border-neutral-200 font-mono">
                      {entry.paidAtPos ? `${currencySymbol}${entry.paidAtPos.toFixed(2)}` : "-"}
                    </td>
                    <td className="p-1.5 text-right border-r border-neutral-200 font-mono font-bold">
                      {entry.debit > 0 ? `${currencySymbol}${entry.debit.toFixed(2)}` : "-"}
                    </td>
                    <td className="p-1.5 text-right border-r border-neutral-200 font-mono font-bold text-emerald-600">
                      {entry.credit > 0 ? `${currencySymbol}${entry.credit.toFixed(2)}` : "-"}
                    </td>
                    <td className="p-1.5 text-right font-mono font-black">
                      {currencySymbol}{entry.balance.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-16 flex justify-between pt-6 border-t border-neutral-300 text-[10px]">
              <div className="text-center w-36 border-t border-black pt-1">গ্রাহকের স্বাক্ষর</div>
              <div className="text-center w-36 border-t border-black pt-1">দোকানদারের স্বাক্ষর</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}