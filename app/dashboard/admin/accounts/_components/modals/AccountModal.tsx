"use client";

import FormModal from "@/components/common/FormModal";
import { FormField } from "@/components/common/ui/form/FormField";
import { IAccount } from "@/types";

export default function AccountModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  account,
  currencySymbol,
  errors = {},
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void;
  loading: boolean;
  account?: IAccount | null;
  currencySymbol: string;
  errors?: Record<string, string>;
}) {
  const isEditing = Boolean(account);

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title={isEditing ? "Edit Account / Wallet" : "Add Bank Account or Wallet"}
      description="Create or update cash drawer, bank account, or mobile wallet."
      loading={loading}
      isEditing={isEditing}
    >
      {account && <input type="hidden" name="id" value={account.id} />}

      <FormField type="text" label="Account Name" name="name" required defaultValue={account?.name || ""} placeholder="e.g. DBBL Bank, bKash Merchant" error={errors.name} />

      <div className="grid grid-cols-2 gap-3">
        <FormField
          type="select"
          label="Account Type"
          name="type"
          required
          defaultValue={account?.type || "CASH"}
          options={[
            { label: "Cash Drawer", value: "CASH" },
            { label: "Bank Account", value: "BANK" },
            { label: "bKash", value: "BKASH" },
            { label: "Nagad", value: "NAGAD" },
            { label: "Rocket", value: "ROCKET" },
            { label: "Other", value: "OTHER" },
          ]}
          error={errors.type}
        />
        {!isEditing ? (
          <FormField type="number" label={`Opening Balance (${currencySymbol})`} name="openingBalance" step="0.01" defaultValue={0} error={errors.openingBalance} />
        ) : (
          <FormField
            type="select"
            label="Status"
            name="status"
            defaultValue={account?.status || "active"}
            options={[{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }]}
            error={errors.status}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField type="text" label="Account / Number" name="accountNumber" defaultValue={account?.accountNumber || ""} placeholder="e.g. 124.101.5940" error={errors.accountNumber} />
        <FormField type="text" label="Bank Name" name="bankName" defaultValue={account?.bankName || ""} placeholder="e.g. DBBL, EBL" error={errors.bankName} />
      </div>

      <FormField type="textarea" label="Notes (Optional)" name="notes" rows={2} defaultValue={account?.notes || ""} error={errors.notes} />
    </FormModal>
  );
}
