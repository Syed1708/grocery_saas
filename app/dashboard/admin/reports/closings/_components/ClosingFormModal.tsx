"use client";

import { useState } from "react";
import FormModal from "@/components/common/FormModal";
import { Input } from "@/components/common/ui/Input";
import { Textarea } from "@/components/common/ui/Textarea";
import { ICurrentShiftSummary } from "@/types/closing";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { createClosingAction } from "@/app/actions/closing-actions";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  summary: ICurrentShiftSummary;
  currencySymbol: string;
}

export default function ClosingFormModal({ isOpen, onClose, summary, currencySymbol }: Props) {
  const [loading, setLoading] = useState(false);
  const [countedCash, setCountedCash] = useState<number>(summary.expectedCash);
  const [notes, setNotes] = useState("");

  const difference = Number((countedCash - summary.expectedCash).toFixed(2));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      openingCash: summary.openingCash,
      cashSales: summary.cashSales,
      cashDueCollected: summary.cashDueCollected,
      cashOtherIncome: summary.cashOtherIncome,
      cashExpenses: summary.cashExpenses,
      cashSupplierPaid: summary.cashSupplierPaid,
      cashRefunds: summary.cashRefunds,
      expectedCash: summary.expectedCash,
      countedCash,
      difference,
      totalInvoices: summary.totalInvoices,
      notes,
    };

    const res = await createClosingAction(payload);
    setLoading(false);

    if (res.success) {
      toast.success("Day-end Z-Report closing locked successfully!");
      onClose();
    } else {
      toast.error(res.error || "Failed to commit closing.");
    }
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="কাউন্টার ক্যাশ ড্রয়ার ক্লোজিং (Z-Report Close)"
      description="Compare drawer cash with shift totals to lock daily register records."
      loading={loading}
      submitLabel="ড্রয়ার লক ও ক্লোজিং সম্পন্ন করুন"
      maxWidth="lg"
    >
      <div className="space-y-3.5">
        {/* Inflows Summary */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl text-xs border border-neutral-200 dark:border-neutral-700/60">
          <div>
            <span className="text-neutral-400 block text-[10px]">প্রারম্ভিক ক্যাশ</span>
            <span className="font-mono font-bold">{currencySymbol}{summary.openingCash.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-neutral-400 block text-[10px]">নগদ বিক্রয় (+)</span>
            <span className="font-mono font-bold text-emerald-600">+{currencySymbol}{summary.cashSales.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-neutral-400 block text-[10px]">মোট ইনভয়েস</span>
            <span className="font-mono font-bold">{summary.totalInvoices} টি</span>
          </div>
        </div>

        {/* Outflows Summary */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl text-xs border border-neutral-200 dark:border-neutral-700/60">
          <div>
            <span className="text-neutral-400 block text-[10px]">ক্যাশ খরচ (-)</span>
            <span className="font-mono font-bold text-red-600">-{currencySymbol}{summary.cashExpenses.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-neutral-400 block text-[10px]">মহাজন পরিষদ (-)</span>
            <span className="font-mono font-bold text-red-600">-{currencySymbol}{summary.cashSupplierPaid.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-neutral-400 block text-[10px]">নগদ রিফান্ড (-)</span>
            <span className="font-mono font-bold text-red-600">-{currencySymbol}{summary.cashRefunds.toFixed(2)}</span>
          </div>
        </div>

        {/* Comparison Section */}
        <div className="p-4 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 flex justify-between items-center">
          <div>
            <span className="text-[11px] font-semibold text-blue-900 dark:text-blue-300 block">
              সিস্টেম হিসাব অনুযায়ী ক্যাশ:
            </span>
            <span className="text-xl font-mono font-black text-blue-700 dark:text-blue-400">
              {currencySymbol}{summary.expectedCash.toFixed(2)}
            </span>
          </div>

          <div className="w-44">
            <Input
              label="বাস্তব গণনাকৃত ক্যাশ *"
              type="number"
              step="0.01"
              required
              value={countedCash}
              onChange={(e) => setCountedCash(Number(e.target.value))}
            />
          </div>
        </div>

        {/* Discrepancy Indicator */}
        {difference === 0 ? (
          <div className="p-2.5 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>সিস্টেম ও ক্যাশ ড্রয়ারের টাকা সম্পূর্ণ মিলে গেছে (Exact Match)।</span>
          </div>
        ) : (
          <div
            className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
              difference < 0
                ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300"
                : "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300"
            }`}
          >
            <AlertCircle size={16} />
            <span>
              গরমিল সনাক্ত: <strong>{currencySymbol}{Math.abs(difference).toFixed(2)} {difference < 0 ? "ঘাটতি (Shortage)" : "উদ্বৃত্ত (Surplus)"}</strong>
            </span>
          </div>
        )}

        <Textarea
          label="ক্লোজিং অডিট মন্তব্য / নোট (Optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. ভাংতির গরমিলের কারণে ৫০ টাকা শর্টেজ..."
          rows={2}
        />
      </div>
    </FormModal>
  );
}