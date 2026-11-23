"use client";

import FormModal from "@/components/common/FormModal";
import { FormField } from "@/components/common/ui/form/FormField";
import { IBankCheque } from "@/types";

export default function ChequeModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  cheque,
  currencySymbol,
  errors = {},
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void;
  loading: boolean;
  cheque?: IBankCheque | null;
  currencySymbol: string;
  errors?: Record<string, string>;
}) {
  const isEditing = Boolean(cheque);

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title={isEditing ? `Edit Cheque #${cheque?.chequeNumber}` : "Log Bank Cheque (চেক এন্ট্রি)"}
      description="Record or update received and issued cheques."
      loading={loading}
      isEditing={isEditing}
      submitLabel={isEditing ? "Update Cheque" : "Save Cheque"}
    >
      {cheque && <input type="hidden" name="id" value={cheque.id} />}

      <div className="grid grid-cols-2 gap-3">
        <FormField
          type="select"
          label="Cheque Type"
          name="type"
          required
          defaultValue={cheque?.type || "RECEIVED"}
          options={[
            { label: "Received (প্রাপ্ত চেক)", value: "RECEIVED" },
            { label: "Issued (প্রদত্ত চেক)", value: "ISSUED" },
          ]}
          error={errors.type}
        />
        <FormField type="text" label="Party Name" name="partyName" required defaultValue={cheque?.partyName || ""} placeholder="Customer or Supplier Name" error={errors.partyName} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField type="text" label="Bank Name" name="bankName" required defaultValue={cheque?.bankName || ""} placeholder="e.g. City Bank" error={errors.bankName} />
        <FormField type="text" label="Cheque Number" name="chequeNumber" required defaultValue={cheque?.chequeNumber || ""} placeholder="e.g. CHQ-90412" error={errors.chequeNumber} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          type="date"
          label="Cheque Date"
          name="chequeDate"
          required
          defaultValue={cheque?.chequeDate ? new Date(cheque.chequeDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]}
          error={errors.chequeDate}
        />
        <FormField type="number" label={`Amount (${currencySymbol})`} name="amount" step="0.01" required defaultValue={cheque?.amount ?? ""} placeholder="0.00" error={errors.amount} />
      </div>
    </FormModal>
  );
}
