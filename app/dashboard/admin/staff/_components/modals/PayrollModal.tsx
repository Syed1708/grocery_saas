"use client";
import FormModal from "@/components/common/FormModal";
import { Input } from "@/components/common/ui/Input";
import { Select } from "@/components/common/ui/Select";
import { Textarea } from "@/components/common/ui/Textarea";

export default function PayrollModal({ isOpen, onClose, onSubmit, loading, staff }: { isOpen: boolean; onClose: () => void; onSubmit: (e: any) => void; loading: boolean; staff: any[] }) {
  const staffOptions = staff.map(s => ({ label: `${s.name} (${s.designation})`, value: s.id }));
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => ({ label: m, value: m }));

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={onSubmit} title="Generate Monthly Payroll (বেতন প্রদান)" description="Calculate net salary with automatic advance deductions." loading={loading} submitLabel="Pay Salary" maxWidth="lg">
      <Select label="Employee *" name="staffId" required options={staffOptions} placeholder="Select staff member" />
      <div className="grid grid-cols-3 gap-3">
        <Select label="Month *" name="month" required defaultValue="October" options={months} />
        <Input label="Year *" name="year" type="number" required defaultValue={new Date().getFullYear()} />
        <Input label="Payment Date *" name="salaryDate" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
      </div>
      <div className="grid grid-cols-4 gap-2">
        <Input label="Basic Salary" name="basicSalary" type="number" step="0.01" required defaultValue={15000} />
        <Input label="Allowance" name="allowance" type="number" step="0.01" defaultValue={0} />
        <Input label="Advance Deduct" name="advanceDeduction" type="number" step="0.01" defaultValue={0} />
        <Input label="Penalties" name="penaltyDeduction" type="number" step="0.01" defaultValue={0} />
      </div>
      <Textarea label="Notes / Remarks" name="notes" rows={2} />
    </FormModal>
  );
}