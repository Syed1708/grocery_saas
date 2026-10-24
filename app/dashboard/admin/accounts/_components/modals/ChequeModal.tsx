"use client";

import FormModal from "@/components/common/FormModal";
import { Input } from "@/components/common/ui/Input";
import { Select } from "@/components/common/ui/Select";

export default function ChequeModal({
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
      title="Log Bank Cheque (চেক এন্ট্রি)"
      description="Record received or issued cheques."
      loading={loading}
      submitLabel="Save Cheque"
    >
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Cheque Type"
          name="type"
          required
          defaultValue="RECEIVED"
          options={[
            { label: "Received (প্রাপ্ত চেক)", value: "RECEIVED" },
            { label: "Issued (প্রদত্ত চেক)", value: "ISSUED" },
          ]}
        />
        <Input label="Party Name" name="partyName" required placeholder="Customer or Supplier Name" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Bank Name" name="bankName" required placeholder="e.g. City Bank" />
        <Input label="Cheque Number" name="chequeNumber" required placeholder="e.g. CHQ-90412" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Cheque Date" name="chequeDate" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
        <Input label={`Amount (${currencySymbol})`} name="amount" type="number" step="0.01" required placeholder="0.00" />
      </div>
    </FormModal>
  );
}