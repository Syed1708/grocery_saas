"use client";

import FormModal from "@/components/common/FormModal";
import { Input } from "@/components/common/ui/Input";
import { Select } from "@/components/common/ui/Select";

export default function TransferModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  accounts,
  currencySymbol,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  accounts: any[];
  currencySymbol: string;
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
        <Select label="From Account" name="fromAccountId" required options={accountOptions} placeholder="Select source" />
        <Select label="To Account" name="toAccountId" required options={accountOptions} placeholder="Select destination" />
      </div>
      <Input label={`Transfer Amount (${currencySymbol})`} name="amount" type="number" step="0.01" min="0.01" required placeholder="0.00" />
      <Input label="Notes / Memo" name="note" placeholder="e.g. Daily cash deposit to bank" />
    </FormModal>
  );
}