"use client";

import Modal from "@/components/common/Modal";
import { Input } from "@/components/common/ui/Input";
import { Select } from "@/components/common/ui/Select";
import { ILoan } from "@/types";

export default function InstallmentModal({
  loan,
  onClose,
  onSubmit,
  loading,
  accounts,
  currencySymbol,
}: {
  loan: ILoan | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  accounts: any[];
  currencySymbol: string;
}) {
  if (!loan) return null;
  const accountOptions = accounts.map((a) => ({
    label: `${a.name} (Bal: ${currencySymbol}${a.currentBalance})`,
    value: a.id,
  }));

  return (
    <Modal
      isOpen={Boolean(loan)}
      onClose={onClose}
      title={`Pay Installment for ${loan.personName}`}
      description={`Remaining loan balance: ${currencySymbol}${loan.remainingAmount}`}
      maxWidth="sm"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <input type="hidden" name="loanId" value={loan.id} />
        <Select label="Payment Account / Wallet" name="accountId" required options={accountOptions} placeholder="Select account" />
        <Input label={`Installment Amount (${currencySymbol})`} name="amount" type="number" step="0.01" min="0.01" max={loan.remainingAmount} required defaultValue={loan.remainingAmount} />
        <Input label="Payment Date" name="paymentDate" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
        <Input label="Notes" name="notes" placeholder="e.g. Monthly installment #1" />
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 cursor-pointer">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer">
            {loading ? "Recording..." : "Confirm Installment"}
          </button>
        </div>
      </form>
    </Modal>
  );
}