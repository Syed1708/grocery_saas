"use client";
import FormModal from "@/components/common/FormModal";
import { Input } from "@/components/common/ui/Input";
import { Select } from "@/components/common/ui/Select";
import { Textarea } from "@/components/common/ui/Textarea";
import { IOwnerTransaction } from "@/types";

export default function EquityModal({ isOpen, onClose, onSubmit, loading, equity, currencySymbol }: { isOpen: boolean; onClose: () => void; onSubmit: (e: any) => void; loading: boolean; equity?: IOwnerTransaction | null; currencySymbol: string }) {
  const isEditing = Boolean(equity);
  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={onSubmit} title={isEditing ? "Edit Equity Transaction" : "Owner Capital & Drawings (মূলধন ও উত্তোলন)"} description="Record owner capital investments or personal withdrawals." loading={loading} isEditing={isEditing} submitLabel="Save Transaction">
      {equity && <input type="hidden" name="id" value={equity.id} />}
      <div className="grid grid-cols-2 gap-3">
        <Select label="Transaction Type *" name="type" required defaultValue={equity?.type || "CAPITAL"} options={[{ label: "Capital Injection (মূলধন বৃদ্ধি)", value: "CAPITAL" }, { label: "Owner Drawing (ব্যক্তিগত উত্তোলন)", value: "DRAWING" }]} />
        <Input label={`Amount (${currencySymbol}) *`} name="amount" type="number" step="0.01" required defaultValue={equity?.amount ?? ""} placeholder="0.00" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Date *" name="transactionDate" type="date" required defaultValue={equity?.transactionDate ? new Date(equity.transactionDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]} />
        <Input label="Purpose / Reason" name="purpose" defaultValue={equity?.purpose || ""} placeholder="e.g. Additional business capital" />
      </div>
      <Textarea label="Notes" name="notes" rows={2} defaultValue={equity?.notes || ""} />
    </FormModal>
  );
}