"use client";
import FormModal from "@/components/common/FormModal";
import { FormField } from "@/components/common/ui/form/FormField";
import { IStaff, IDepartment } from "@/types";

export default function StaffModal({ isOpen, onClose, onSubmit, loading, staff, departments, errors = {} }: { isOpen: boolean; onClose: () => void; onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void; loading: boolean; staff?: IStaff | null; departments: IDepartment[]; errors?: Record<string, string> }) {
  const isEditing = Boolean(staff);
  const deptOptions = departments.map(d => ({ label: d.name, value: d.id }));

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={onSubmit} title={isEditing ? "Edit Employee Profile" : "Register Employee (কর্মচারী যোগ করুন)"} description="Update staff salary, designation, and contact details." loading={loading} isEditing={isEditing} maxWidth="lg">
      {staff && <input type="hidden" name="id" value={staff.id} />}
      <div className="grid grid-cols-2 gap-3">
        <FormField type="text" label="Full Name" name="name" required defaultValue={staff?.name || ""} placeholder="e.g. Md. Rahim" error={errors.name} />
        <FormField type="text" label="Mobile Phone" name="phone" required defaultValue={staff?.phone || ""} placeholder="01700000000" error={errors.phone} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField type="select" label="Department" name="departmentId" required placeholder="Select department" defaultValue={staff ? departments.find(d => d.name === staff.departmentName)?.id : ""} options={deptOptions} error={errors.departmentId} />
        <FormField type="text" label="Designation" name="designation" required defaultValue={staff?.designation || ""} placeholder="e.g. Senior Cashier" error={errors.designation} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <FormField type="date" label="Joining Date" name="joiningDate" required defaultValue={staff?.joiningDate ? new Date(staff.joiningDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]} error={errors.joiningDate} />
        <FormField type="number" label="Basic Salary" name="basicSalary" step="0.01" required defaultValue={staff?.basicSalary ?? 15000} error={errors.basicSalary} />
        <FormField type="select" label="Status" name="status" defaultValue={staff?.status || "ACTIVE"} options={[{ label: "Active", value: "ACTIVE" }, { label: "Inactive", value: "INACTIVE" }, { label: "Terminated", value: "TERMINATED" }]} error={errors.status} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField type="text" label="NID Number" name="nidNumber" defaultValue={staff?.nidNumber || ""} placeholder="National ID Card Number" error={errors.nidNumber} />
        <FormField type="text" label="Emergency Phone" name="emergencyPhone" defaultValue={staff?.emergencyPhone || ""} placeholder="Family contact number" error={errors.emergencyPhone} />
      </div>
      <FormField type="textarea" label="Permanent Address" name="address" rows={2} defaultValue={staff?.address || ""} error={errors.address} />
    </FormModal>
  );
}
