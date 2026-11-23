"use client";
import { useState } from "react";
import FormModal from "@/components/common/FormModal";
import { FormField } from "@/components/common/ui/form/FormField";
import { IOtherIncome } from "@/types";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/payment-methods";

export default function IncomeModal({ isOpen, onClose, onSubmit, loading, income, currencySymbol, errors = {} }: { isOpen: boolean; onClose: () => void; onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void; loading: boolean; income?: IOtherIncome | null; currencySymbol: string; errors?: Record<string, string> }) {
  const isEditing = Boolean(income);
  const [defaultReceiptNo] = useState(() => `INC-${Date.now().toString().slice(-6)}`);

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={onSubmit} title={isEditing ? "Edit Other Income" : "Record Other Income (অন্যান্য আয়)"} description="Log secondary revenues like scrap sale or delivery fees." loading={loading} isEditing={isEditing}>
      {income && <input type="hidden" name="id" value={income.id} />}
      <FormField type="text" label="Income Source" name="incomeSource" required defaultValue={income?.incomeSource || ""} placeholder="e.g. Carton scrap sale" error={errors.incomeSource} />
      <div className="grid grid-cols-2 gap-3">
        <FormField type="text" label="Receipt #" name="receiptNo" required defaultValue={income?.receiptNo || defaultReceiptNo} error={errors.receiptNo} />
        <FormField type="number" label={`Amount (${currencySymbol})`} name="amount" step="0.01" required defaultValue={income?.amount ?? ""} placeholder="0.00" error={errors.amount} />
      </div>
      <FormField type="date" label="Date" name="incomeDate" required defaultValue={income?.incomeDate ? new Date(income.incomeDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]} error={errors.incomeDate} />
      <FormField type="select" label="Received In" name="paymentMethod" defaultValue={income?.paymentMethod || "cash"} options={PAYMENT_METHOD_OPTIONS} error={errors.paymentMethod} />
      <FormField type="textarea" label="Notes" name="note" rows={2} defaultValue={income?.note || ""} error={errors.note} />
    </FormModal>
  );
}
