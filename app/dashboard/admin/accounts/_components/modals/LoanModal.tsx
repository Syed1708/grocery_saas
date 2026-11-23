"use client";

import FormModal from "@/components/common/FormModal";
import { FormField } from "@/components/common/ui/form/FormField";
import { IAccount, ILoan } from "@/types";

export default function LoanModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  loan,
  accounts,
  currencySymbol,
  errors = {},
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void;
  loading: boolean;
  loan?: ILoan | null;
  accounts: IAccount[];
  currencySymbol: string;
  errors?: Record<string, string>;
}) {
  const isEditing = Boolean(loan);
  const termsLocked = isEditing && Number(loan?.totalPaid ?? 0) > 0;
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
        <FormField
          type="select"
          label="Loan Type"
          name="type"
          required
          disabled={termsLocked}
          hint={termsLocked ? "Type cannot change after repayments have started." : undefined}
          defaultValue={loan?.type || "TAKEN"}
          options={[
            { label: "Loan Taken (ঋণ গ্রহণ - Money In)", value: "TAKEN" },
            { label: "Loan Given (ধার প্রদান - Money Out)", value: "GIVEN" },
          ]}
          error={errors.type}
        />
        <FormField type="text" label="Person Name" name="personName" required defaultValue={loan?.personName || ""} placeholder="Lender or Borrower Name" error={errors.personName} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          type="number"
          label={`Amount (${currencySymbol})`}
          name="amount"
          step="0.01"
          required
          disabled={termsLocked}
          hint={termsLocked ? "Amount cannot change after repayments have started." : undefined}
          defaultValue={loan?.amount ?? ""}
          placeholder="0.00"
          error={errors.amount}
        />
        {!isEditing ? (
          <FormField type="select" label="Affected Account" name="accountId" required options={accountOptions} placeholder="Select account" error={errors.accountId} />
        ) : (
          <FormField type="text" label="Phone Number" name="phone" defaultValue={loan?.phone || ""} placeholder="01700000000" error={errors.phone} />
        )}
      </div>

      {!isEditing && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <FormField type="date" label="Loan Date" name="loanDate" required defaultValue={new Date().toISOString().split("T")[0]} error={errors.loanDate} />
            <FormField type="text" label="Phone Number" name="phone" placeholder="01700000000" error={errors.phone} />
          </div>
          <FormField type="date" label="Due Date (Optional)" name="dueDate" error={errors.dueDate} />
        </>
      )}

      {isEditing && (
        <div className="grid grid-cols-2 gap-3">
          <FormField type="date" label="Due Date" name="dueDate" defaultValue={loan?.dueDate ? new Date(loan.dueDate).toISOString().split("T")[0] : ""} error={errors.dueDate} />
          <div />
        </div>
      )}

      <FormField type="text" label="Notes / Terms" name="notes" defaultValue={loan?.notes || ""} placeholder="e.g. 5% monthly interest" error={errors.notes} />
    </FormModal>
  );
}
