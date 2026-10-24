"use client";

import FormModal from "@/components/common/FormModal";
import { Input } from "@/components/common/ui/Input";
import { Select } from "@/components/common/ui/Select";
import { Textarea } from "@/components/common/ui/Textarea";
import { IAccount } from "@/types";

export default function AccountModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  account,
  currencySymbol,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  account?: IAccount | null;
  currencySymbol: string;
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

      <Input
        label="Account Name"
        name="name"
        required
        defaultValue={account?.name || ""}
        placeholder="e.g. DBBL Bank, bKash Merchant"
      />

      <div className="grid grid-cols-2 gap-3">
        <Select
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
        />
        {!isEditing && (
          <Input
            label={`Opening Balance (${currencySymbol})`}
            name="openingBalance"
            type="number"
            step="0.01"
            defaultValue={0}
          />
        )}
        {isEditing && (
          <Select
            label="Status"
            name="status"
            defaultValue={account?.status || "active"}
            options={[
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ]}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Account / Number"
          name="accountNumber"
          defaultValue={account?.accountNumber || ""}
          placeholder="e.g. 124.101.5940"
        />
        <Input
          label="Bank Name"
          name="bankName"
          defaultValue={account?.bankName || ""}
          placeholder="e.g. DBBL, EBL"
        />
      </div>

      <Textarea
        label="Notes (Optional)"
        name="notes"
        rows={2}
        defaultValue={account?.notes || ""}
      />
    </FormModal>
  );
}