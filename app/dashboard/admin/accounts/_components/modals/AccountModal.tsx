"use client";

import FormModal from "@/components/common/FormModal";
import { Input } from "@/components/common/ui/Input";
import { Select } from "@/components/common/ui/Select";
import { Textarea } from "@/components/common/ui/Textarea";

export default function AccountModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  currencySymbol,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  currencySymbol: string;
}) {
  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title="Add Bank Account or Wallet"
      description="Create cash drawer, bank account, or mobile wallet."
      loading={loading}
    >
      <Input label="Account Name" name="name" required placeholder="e.g. DBBL Bank, bKash Merchant" />
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Account Type"
          name="type"
          required
          defaultValue="CASH"
          options={[
            { label: "Cash Drawer", value: "CASH" },
            { label: "Bank Account", value: "BANK" },
            { label: "bKash", value: "BKASH" },
            { label: "Nagad", value: "NAGAD" },
            { label: "Rocket", value: "ROCKET" },
            { label: "Other", value: "OTHER" },
          ]}
        />
        <Input label={`Opening Balance (${currencySymbol})`} name="openingBalance" type="number" step="0.01" defaultValue={0} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Account / Number" name="accountNumber" placeholder="e.g. 124.101.5940" />
        <Input label="Bank Name" name="bankName" placeholder="e.g. DBBL, EBL" />
      </div>
      <Textarea label="Notes (Optional)" name="notes" rows={2} />
    </FormModal>
  );
}