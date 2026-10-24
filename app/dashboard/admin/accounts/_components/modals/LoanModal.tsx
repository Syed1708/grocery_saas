"use client";

import FormModal from "@/components/common/FormModal";
import { Input } from "@/components/common/ui/Input";
import { Select } from "@/components/common/ui/Select";
import { ILoan } from "@/types";

export default function LoanModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  loan,
  accounts,
  currencySymbol,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  loan?: ILoan | null;
  accounts: any[];
  currencySymbol: string;
}) {
  const isEditing = Boolean(loan);
  const accountOptions = accounts.map((a) => ({
    label: `${a.name} (Bal: ${currencySymbol}${a.currentBalance})`,
    value: a.id,
  }));

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title={isEditing ? `Edit Loan - ${loan?.personName}` : "Record Loan / Hawlat (ঋণ ও হাওলাত)"}
      description="Update borrower/lender terms and due dates."
      loading={loading}
      isEditing={isEditing}
      submitLabel={isEditing ? "Update Loan" : "Save Loan"}
    >
      {loan && <input type="hidden" name="id" value={loan.id} />}

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Loan Type"
          name="type"
          required
          disabled={isEditing} // Cannot change loan type after creation
          defaultValue={loan?.type || "TAKEN"}
          options={[
            { label: "Loan Taken (ঋণ গ্রহণ - Money In)", value: "TAKEN" },
            { label: "Loan Given (ধার প্রদান - Money Out)", value: "GIVEN" },
          ]}
        />
        <Input label="Person Name" name="personName" required defaultValue={loan?.personName || ""} placeholder="Lender or Borrower Name" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label={`Amount (${currencySymbol})`}
          name="amount"
          type="number"
          step="0.01"
          required
          disabled={isEditing} // Principal amount locked after creation for accounting safety
          defaultValue={loan?.amount ?? ""}
          placeholder="0.00"
        />
        {!isEditing ? (
          <Select label="Affected Account" name="accountId" required options={accountOptions} placeholder="Select account" />
        ) : (
          <Input label="Phone Number" name="phone" defaultValue={loan?.phone || ""} placeholder="01700000000" />
        )}
      </div>

      {!isEditing && (
        <div className="grid grid-cols-2 gap-3">
          <Input label="Loan Date" name="loanDate" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
          <Input label="Phone Number" name="phone" placeholder="01700000000" />
        </div>
      )}

      {isEditing && (
        <div className="grid grid-cols-2 gap-3">
          <Input label="Due Date" name="dueDate" type="date" defaultValue={loan?.dueDate ? new Date(loan.dueDate).toISOString().split("T")[0] : ""} />
          <div />
        </div>
      )}

      <Input label="Notes / Terms" name="notes" defaultValue={loan?.notes || ""} placeholder="e.g. 5% monthly interest" />
    </FormModal>
  );
}