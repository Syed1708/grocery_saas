"use client";
import FormModal from "@/components/common/FormModal";
import { FormField } from "@/components/common/ui/form/FormField";
import type { IStaff } from "@/types";

export default function PayrollModal({ isOpen, onClose, onSubmit, loading, staff, errors = {} }: { isOpen: boolean; onClose: () => void; onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void; loading: boolean; staff: IStaff[]; errors?: Record<string, string> }) {
  const staffOptions = staff.map(s => ({ label: `${s.name} (${s.designation})`, value: s.id }));
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => ({ label: m, value: m }));

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={onSubmit} title="Generate Monthly Payroll (বেতন প্রদান)" description="Calculate net salary with automatic advance deductions." loading={loading} submitLabel="Pay Salary" maxWidth="lg">
      <FormField type="select" label="Employee" name="staffId" required placeholder="Select staff member" options={staffOptions} error={errors.staffId} />
      <div className="grid grid-cols-3 gap-3">
        <FormField type="select" label="Month" name="month" required defaultValue="October" options={months} error={errors.month} />
        <FormField type="number" label="Year" name="year" required defaultValue={new Date().getFullYear()} error={errors.year} />
        <FormField type="date" label="Payment Date" name="salaryDate" required defaultValue={new Date().toISOString().split("T")[0]} error={errors.salaryDate} />
      </div>
      <div className="grid grid-cols-4 gap-2">
        <FormField type="number" label="Basic Salary" name="basicSalary" step="0.01" required defaultValue={15000} error={errors.basicSalary} />
        <FormField type="number" label="Allowance" name="allowance" step="0.01" defaultValue={0} error={errors.allowance} />
        <FormField type="number" label="Advance Deduct" name="advanceDeduction" step="0.01" defaultValue={0} error={errors.advanceDeduction} />
        <FormField type="number" label="Penalties" name="penaltyDeduction" step="0.01" defaultValue={0} error={errors.penaltyDeduction} />
      </div>
      <FormField type="textarea" label="Notes / Remarks" name="notes" rows={2} error={errors.notes} />
    </FormModal>
  );
}
