"use client";
import FormModal from "@/components/common/FormModal";
import { Input } from "@/components/common/ui/Input";
import { Select } from "@/components/common/ui/Select";
import { Textarea } from "@/components/common/ui/Textarea";

export default function AdvanceModal({ isOpen, onClose, onSubmit, loading, staff, currencySymbol }: { isOpen: boolean; onClose: () => void; onSubmit: (e: any) => void; loading: boolean; staff: any[]; currencySymbol: string }) {
  const staffOptions = staff.map(s => ({ label: `${s.name} (${s.designation})`, value: s.id }));
  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={onSubmit} title="Issue Salary Advance (অগ্রিম বেতন / হাওলাত)" description="Give mid-month cash advance to staff, auto-deducted from payroll." loading={loading} submitLabel="Issue Advance">
      <Select label="Employee *" name="staffId" required options={staffOptions} placeholder="Select staff member" />
      <div className="grid grid-cols-2 gap-3">
        <Input label={`Amount (${currencySymbol}) *`} name="amount" type="number" step="0.01" required placeholder="0.00" />
        <Input label="Date *" name="advanceDate" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
      </div>
      <Input label="Purpose / Reason" name="purpose" placeholder="e.g. Medical emergency" />
      <Textarea label="Notes" name="notes" rows={2} />
    </FormModal>
  );
}