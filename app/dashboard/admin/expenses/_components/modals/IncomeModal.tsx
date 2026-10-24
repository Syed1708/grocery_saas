"use client";
import FormModal from "@/components/common/FormModal";
import { Input } from "@/components/common/ui/Input";
import { Textarea } from "@/components/common/ui/Textarea";
import { IOtherIncome } from "@/types";

export default function IncomeModal({ isOpen, onClose, onSubmit, loading, income, currencySymbol }: { isOpen: boolean; onClose: () => void; onSubmit: (e: any) => void; loading: boolean; income?: IOtherIncome | null; currencySymbol: string }) {
  const isEditing = Boolean(income);
  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={onSubmit} title={isEditing ? "Edit Other Income" : "Record Other Income (অন্যান্য আয়)"} description="Log secondary revenues like scrap sale or delivery fees." loading={loading} isEditing={isEditing}>
      {income && <input type="hidden" name="id" value={income.id} />}
      <Input label="Income Source *" name="incomeSource" required defaultValue={income?.incomeSource || ""} placeholder="e.g. Carton scrap sale" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Receipt # *" name="receiptNo" required defaultValue={income?.receiptNo || `INC-${Date.now().toString().slice(-6)}`} />
        <Input label={`Amount (${currencySymbol}) *`} name="amount" type="number" step="0.01" required defaultValue={income?.amount ?? ""} placeholder="0.00" />
      </div>
      <Input label="Date *" name="incomeDate" type="date" required defaultValue={income?.incomeDate ? new Date(income.incomeDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]} />
      <Textarea label="Notes" name="note" rows={2} defaultValue={income?.note || ""} />
    </FormModal>
  );
}