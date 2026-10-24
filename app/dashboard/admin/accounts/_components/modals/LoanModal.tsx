"use client";

import FormModal from "@/components/common/FormModal";
import { Input } from "@/components/common/ui/Input";
import { Select } from "@/components/common/ui/Select";

export default function LoanModal({
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
      title="Record Loan / Hawlat (ঋণ ও হাওলাত)"
      description="Record money borrowed or lent out, linked to an account."
      loading={loading}
      submitLabel="Save Loan"
    >
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Loan Type"
          name="type"
          required
          defaultValue="TAKEN"
          options={[
            { label: "Loan Taken (ঋণ গ্রহণ - Money In)", value: "TAKEN" },
            { label: "Loan Given (ধার প্রদান - Money Out)", value: "GIVEN" },
          ]}
        />
        <Input label="Person Name" name="personName" required placeholder="Lender or Borrower Name" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label={`Amount (${currencySymbol})`} name="amount" type="number" step="0.01" required placeholder="0.00" />
        <Select label="Affected Account" name="accountId" required options={accountOptions} placeholder="Select account" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Loan Date" name="loanDate" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
        <Input label="Phone Number" name="phone" placeholder="01700000000" />
      </div>
      <Input label="Notes / Terms" name="notes" placeholder="e.g. 5% monthly interest" />
    </FormModal>
  );
}