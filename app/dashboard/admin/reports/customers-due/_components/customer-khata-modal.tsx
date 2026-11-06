"use client";
"use no memo"; // 👈 Prevents React Compiler memoization clashes

import { useEffect, useState, useTransition } from "react";
import FormModal from "@/components/common/FormModal";
import { ICustomerDueRow, ICustomerKhataEntry, ICustomerKhataSummary } from "@/types/index";
import { Loader2, Printer, FileText } from "lucide-react";
import { fetchCustomerKhataAction } from "@/app/actions/customer-khata-actions";
import CustomerKhataPrint from "./CustomerKhataPrint";

interface Props {
  customer: ICustomerDueRow | null;
  currencySymbol: string;
  shopName: string;
  branchName?: string;
  onClose: () => void;
}

export default function CustomerKhataModal({
  customer,
  currencySymbol = "৳",
  shopName,
  branchName = "Main Branch",
  onClose,
}: Props) {
  // 🛡️ React 19 standard: useTransition manages loading automatically
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<{ summary: ICustomerKhataSummary; ledger: ICustomerKhataEntry[] } | null>(null);
  const [printFormat, setPrintFormat] = useState<"thermal" | "a4">("thermal");

  useEffect(() => {
    if (!customer?.id) return;
    let ignore = false;

    // Async transition without synchronous setState
    startTransition(async () => {
      const res = await fetchCustomerKhataAction(customer.id);
      if (!ignore && res.success && res.data) {
        setData(res.data);
      }
    });

    return () => {
      ignore = true;
    };
  }, [customer?.id]);

  if (!customer) return null;

  const handlePrint = (format: "thermal" | "a4") => {
    setPrintFormat(format);
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
      }, 80);
    });
  };

  return (
    <>
      {/* Interactive Modal Screen */}
      <div className="print:hidden">
        <FormModal
          isOpen={!!customer}
          onClose={onClose}
          onSubmit={(e) => {
            e.preventDefault();
            handlePrint("thermal");
          }}
          title={`গ্রাহক বাকি খাতা: ${customer.name}`}
          description={`মোবাইল: ${customer.phone || "N/A"} | গ্রাম/এলাকা: ${customer.village || customer.address || "N/A"}`}
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
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-neutral-900 hover:bg-black text-white rounded-lg transition cursor-pointer"
                >
                  <Printer size={13} /> ৮০মিমি ক্যাশ রসিদ (Thermal)
                </button>
                <button
                  type="button"
                  onClick={() => handlePrint("a4")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition cursor-pointer"
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
            {isPending ? (
              <div className="py-12 flex justify-center items-center gap-2 text-neutral-400 text-xs">
                <Loader2 className="animate-spin" size={16} /> খাতা লোড হচ্ছে...
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto border border-neutral-200 dark:border-neutral-800 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-neutral-100 dark:bg-neutral-800 sticky top-0 font-semibold border-b border-neutral-200 dark:border-neutral-700 z-10 text-[11px]">
                    <tr>
                      <th className="p-2.5">তারিখ</th>
                      <th className="p-2.5">লেনদেন / বিবরণ</th>
                      <th className="p-2.5 text-right">মোট বিল</th>
                      <th className="p-2.5 text-right">জমা (Paid)</th>
                      <th className="p-2.5 text-right">বাকি বৃদ্ধি (+)</th>
                      <th className="p-2.5 text-right">চলতি জের (Due)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                    {!data?.ledger.length ? (
                      <tr>
                        <td colSpan={6} className="text-center p-6 text-neutral-400">কোন লেনদেন পাওয়া যায়নি।</td>
                      </tr>
                    ) : (
                      data.ledger.map((entry) => (
                        <tr key={entry.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 text-[11px]">
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

      {/* Clean Extracted Print View */}
      <CustomerKhataPrint
        customer={customer}
        ledger={data?.ledger || []}
        currencySymbol={currencySymbol}
        shopName={shopName}
        branchName={branchName}
        printFormat={printFormat}
      />
    </>
  );
}