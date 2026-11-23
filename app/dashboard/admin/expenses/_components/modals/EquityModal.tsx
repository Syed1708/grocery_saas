"use client";
import FormModal from "@/components/common/FormModal";
import { FormField } from "@/components/common/ui/form/FormField";
import { IOwnerTransaction } from "@/types";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/payment-methods";

export default function EquityModal({ isOpen, onClose, onSubmit, loading, equity, currencySymbol, errors = {} }: { isOpen: boolean; onClose: () => void; onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void; loading: boolean; equity?: IOwnerTransaction | null; currencySymbol: string; errors?: Record<string, string> }) {
  const isEditing = Boolean(equity);
  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={onSubmit} title={isEditing ? "Edit Equity Transaction" : "Owner Capital & Drawings (মূলধন ও উত্তোলন)"} description="Record owner capital investments or personal withdrawals." loading={loading} isEditing={isEditing} submitLabel="Save Transaction">
      {equity && <input type="hidden" name="id" value={equity.id} />}
      <div className="grid grid-cols-2 gap-3">
        <FormField type="select" label="Transaction Type" name="type" required defaultValue={equity?.type || "CAPITAL"} options={[{ label: "Capital Injection (মূলধন বৃদ্ধি)", value: "CAPITAL" }, { label: "Owner Drawing (ব্যক্তিগত উত্তোলন)", value: "DRAWING" }]} error={errors.type} />
        <FormField type="number" label={`Amount (${currencySymbol})`} name="amount" step="0.01" required defaultValue={equity?.amount ?? ""} placeholder="0.00" error={errors.amount} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField type="date" label="Date" name="transactionDate" required defaultValue={equity?.transactionDate ? new Date(equity.transactionDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]} error={errors.transactionDate} />
        <FormField type="select" label="Payment Source" name="paymentMethod" defaultValue={equity?.paymentMethod || "cash"} options={PAYMENT_METHOD_OPTIONS} error={errors.paymentMethod} />
      </div>
      <FormField type="text" label="Purpose / Reason" name="purpose" defaultValue={equity?.purpose || ""} placeholder="e.g. Additional business capital" error={errors.purpose} />
      <FormField type="textarea" label="Notes" name="notes" rows={2} defaultValue={equity?.notes || ""} error={errors.notes} />
    </FormModal>
  );
}
