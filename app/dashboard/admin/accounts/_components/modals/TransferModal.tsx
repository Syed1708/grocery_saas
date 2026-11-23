"use client";

import FormModal from "@/components/common/FormModal";
import { FormField } from "@/components/common/ui/form/FormField";
import { IAccount } from "@/types";

export default function TransferModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  accounts,
  currencySymbol,
  errors = {},
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void;
  loading: boolean;
  accounts: IAccount[];
  currencySymbol: string;
  errors?: Record<string, string>;
}) {
  const accountOptions = accounts.map((a) => ({
    label: `${a.name} (Bal: ${currencySymbol}${a.currentBalance})`,
    value: a.id,
  }));

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title="Fund Transfer (টাকা স্থানান্তর)"
      description="Transfer funds between store accounts securely."
      loading={loading}
      submitLabel="Transfer Funds"
    >
      <div className="grid grid-cols-2 gap-3">
        <FormField type="select" label="From Account" name="fromAccountId" required options={accountOptions} placeholder="Select source" error={errors.fromAccountId} />
        <FormField type="select" label="To Account" name="toAccountId" required options={accountOptions} placeholder="Select destination" error={errors.toAccountId} />
      </div>
      <FormField type="number" label={`Transfer Amount (${currencySymbol})`} name="amount" step="0.01" min="0.01" required placeholder="0.00" error={errors.amount} />
      <FormField type="text" label="Notes / Memo" name="note" placeholder="e.g. Daily cash deposit to bank" error={errors.note} />
    </FormModal>
  );
}
