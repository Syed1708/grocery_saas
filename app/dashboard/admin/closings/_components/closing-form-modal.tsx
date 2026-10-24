"use client";

import { useState } from "react";
import FormModal from "@/components/common/FormModal";
import { Input } from "@/components/common/ui/Input";
import { Textarea } from "@/components/common/ui/Textarea";
import { ICurrentShiftSummary } from "@/types/index";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
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
      closingDate: new Date().toISOString().split("T")[0],
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
      toast.success("Day-end Z-Report recorded successfully!");
      onClose();
    } else {
      toast.error(res.error || "Failed to record closing.");
    }
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Register Z-Closing Report"
      description="Compare drawer cash with shift totals to lock daily register records."
      loading={loading}
      submitLabel="Commit Closing & Lock Shift"
      maxWidth="lg"
    >
      <div className="space-y-3">
        {/* Inflows */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl text-xs">
          <div>
            <span className="text-neutral-400 block text-[10px]">Opening Float</span>
            <span className="font-mono font-bold">{currencySymbol}{summary.openingCash.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-neutral-400 block text-[10px]">Cash Sales</span>
            <span className="font-mono font-bold text-emerald-600">+{currencySymbol}{summary.cashSales.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-neutral-400 block text-[10px]">Total Slips</span>
            <span className="font-mono font-bold">{summary.totalInvoices}</span>
          </div>
        </div>

        {/* Outflows */}
        <div className="grid grid-cols-2 gap-2 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl text-xs">
          <div>
            <span className="text-neutral-400 block text-[10px]">Expenses</span>
            <span className="font-mono font-bold text-red-600">-{currencySymbol}{summary.cashExpenses.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-neutral-400 block text-[10px]">Supplier Paid</span>
            <span className="font-mono font-bold text-red-600">-{currencySymbol}{summary.cashSupplierPaid.toFixed(2)}</span>
          </div>
        </div>

        {/* Comparison Section */}
        <div className="p-4 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 flex justify-between items-center">
          <div>
            <span className="text-[11px] font-semibold text-blue-900 dark:text-blue-300 block">Expected Drawer Cash:</span>
            <span className="text-xl font-mono font-black text-blue-700 dark:text-blue-400">
              {currencySymbol}{summary.expectedCash.toFixed(2)}
            </span>
          </div>
          <div className="w-40">
            <Input
              label="Counted Cash *"
              type="number"
              step="0.01"
              required
              value={countedCash}
              onChange={(e) => setCountedCash(Number(e.target.value))}
            />
          </div>
        </div>

        {difference !== 0 && (
          <div
            className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
              difference < 0
                ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/50"
                : "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/50"
            }`}
          >
            <AlertCircle size={15} />
            <span>
              Discrepancy: <strong>{currencySymbol}{Math.abs(difference).toFixed(2)} {difference < 0 ? "Shortage" : "Surplus"}</strong>
            </span>
          </div>
        )}

        <Textarea
          label="Closing Audit Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., Shortage due to change discrepancy on slip #104"
          rows={2}
        />
      </div>
    </FormModal>
  );
}