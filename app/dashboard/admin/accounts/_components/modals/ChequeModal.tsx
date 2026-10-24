"use client";

import FormModal from "@/components/common/FormModal";
import { Input } from "@/components/common/ui/Input";
import { Select } from "@/components/common/ui/Select";
import { IBankCheque } from "@/types";

export default function ChequeModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  cheque,
  currencySymbol,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  cheque?: IBankCheque | null;
  currencySymbol: string;
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
        <Select
          label="Cheque Type"
          name="type"
          required
          defaultValue={cheque?.type || "RECEIVED"}
          options={[
            { label: "Received (প্রাপ্ত চেক)", value: "RECEIVED" },
            { label: "Issued (প্রদত্ত চেক)", value: "ISSUED" },
          ]}
        />
        <Input label="Party Name" name="partyName" required defaultValue={cheque?.partyName || ""} placeholder="Customer or Supplier Name" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Bank Name" name="bankName" required defaultValue={cheque?.bankName || ""} placeholder="e.g. City Bank" />
        <Input label="Cheque Number" name="chequeNumber" required defaultValue={cheque?.chequeNumber || ""} placeholder="e.g. CHQ-90412" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Cheque Date"
          name="chequeDate"
          type="date"
          required
          defaultValue={cheque?.chequeDate ? new Date(cheque.chequeDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]}
        />
        <Input
          label={`Amount (${currencySymbol})`}
          name="amount"
          type="number"
          step="0.01"
          required
          defaultValue={cheque?.amount ?? ""}
          placeholder="0.00"
        />
      </div>
    </FormModal>
  );
}