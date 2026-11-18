"use client";
import FormModal from "@/components/common/FormModal";
import { FormField } from "@/components/common/ui/form/FormField";
import type { IStaff } from "@/types";

export default function AdvanceModal({ isOpen, onClose, onSubmit, loading, staff, currencySymbol, errors = {} }: { isOpen: boolean; onClose: () => void; onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void; loading: boolean; staff: IStaff[]; currencySymbol: string; errors?: Record<string, string> }) {
  const staffOptions = staff.map(s => ({ label: `${s.name} (${s.designation})`, value: s.id }));
  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={onSubmit} title="Issue Salary Advance (অগ্রিম বেতন / হাওলাত)" description="Give mid-month cash advance to staff, auto-deducted from payroll." loading={loading} submitLabel="Issue Advance">
      <FormField type="select" label="Employee" name="staffId" required placeholder="Select staff member" options={staffOptions} error={errors.staffId} />
      <div className="grid grid-cols-2 gap-3">
        <FormField type="number" label={`Amount (${currencySymbol})`} name="amount" step="0.01" required placeholder="0.00" error={errors.amount} />
        <FormField type="date" label="Date" name="advanceDate" required defaultValue={new Date().toISOString().split("T")[0]} error={errors.advanceDate} />
      </div>
      <FormField type="text" label="Purpose / Reason" name="purpose" placeholder="e.g. Medical emergency" error={errors.purpose} />
      <FormField type="textarea" label="Notes" name="notes" rows={2} error={errors.notes} />
    </FormModal>
  );
}
