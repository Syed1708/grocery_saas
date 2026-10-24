"use client";

import Modal from "@/components/common/Modal";
import { Select } from "@/components/common/ui/Select";
import { IBankCheque } from "@/types";

export default function ClearChequeModal({
  cheque,
  onClose,
  onSubmit,
  loading,
  accounts,
  currencySymbol,
}: {
  cheque: IBankCheque | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  accounts: any[];
  currencySymbol: string;
}) {
  if (!cheque) return null;
  const accountOptions = accounts.map((a) => ({ label: `${a.name} (${a.type})`, value: a.id }));

  return (
    <Modal
      isOpen={Boolean(cheque)}
      onClose={onClose}
      title={`Clear Cheque #${cheque.chequeNumber}`}
      description={`Select account to deposit/withdraw ${currencySymbol}${cheque.amount} for ${cheque.partyName}.`}
      maxWidth="sm"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Select label="Target Account / Wallet" name="accountId" required options={accountOptions} placeholder="Select account" />
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 cursor-pointer">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 text-white transition cursor-pointer">
            {loading ? "Clearing..." : "Confirm & Deposit"}
          </button>
        </div>
      </form>
    </Modal>
  );
}