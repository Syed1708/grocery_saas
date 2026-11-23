"use client";

import Modal from "@/components/common/Modal";
import { Loader2 } from "lucide-react";
import { ILoan, ILoanInstallment } from "@/types";

export default function LoanInstallmentsModal({
  loan,
  installments,
  loading,
  onClose,
  currencySymbol = "৳",
}: {
  loan: ILoan | null;
  installments: ILoanInstallment[];
  loading: boolean;
  onClose: () => void;
  currencySymbol?: string;
}) {
  if (!loan) return null;

  const paid = installments.reduce((sum, i) => sum + i.amount, 0);

  return (
    <Modal
      isOpen={Boolean(loan)}
      onClose={onClose}
      title={`Installments - ${loan.personName}`}
      description={`Paid ${currencySymbol}${paid.toFixed(2)} of ${currencySymbol}${loan.amount.toFixed(2)} • Remaining ${currencySymbol}${loan.remainingAmount.toFixed(2)}`}
      maxWidth="md"
    >
      <div className="space-y-4 text-xs">
        {loading ? (
          <div className="py-8 flex items-center justify-center gap-2 text-neutral-400">
            <Loader2 size={16} className="animate-spin" /> লোড হচ্ছে...
          </div>
        ) : installments.length === 0 ? (
          <div className="py-8 text-center text-neutral-400">
            এই ঋণের জন্য এখনো কোনো কিস্তি পরিশোধ করা হয়নি।
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-xl">
            {installments.map((inst) => (
              <div key={inst.id} className="p-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="font-mono font-bold block text-neutral-900 dark:text-neutral-100">
                    {inst.voucherNo ? `#${inst.voucherNo}` : "Installment"}
                  </span>
                  <span className="text-[11px] text-neutral-400 block">
                    {new Date(inst.paymentDate).toLocaleDateString()} • {inst.paymentMethod.toUpperCase()}
                    {inst.accountName ? ` • ${inst.accountName}` : ""}
                  </span>
                  {inst.note && <span className="text-[10px] text-neutral-500 block mt-0.5">{inst.note}</span>}
                </div>
                <span className="font-mono font-black text-emerald-600 shrink-0">
                  {currencySymbol}{inst.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </Modal>
  );
}
