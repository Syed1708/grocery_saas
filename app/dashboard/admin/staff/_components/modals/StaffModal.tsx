"use client";
import FormModal from "@/components/common/FormModal";
import { Input } from "@/components/common/ui/Input";
import { Select } from "@/components/common/ui/Select";
import { Textarea } from "@/components/common/ui/Textarea";
import { IStaff, IDepartment } from "@/types";

export default function StaffModal({ isOpen, onClose, onSubmit, loading, staff, departments }: { isOpen: boolean; onClose: () => void; onSubmit: (e: any) => void; loading: boolean; staff?: IStaff | null; departments: IDepartment[] }) {
  const isEditing = Boolean(staff);
  const deptOptions = departments.map(d => ({ label: d.name, value: d.id }));

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={onSubmit} title={isEditing ? "Edit Employee Profile" : "Register Employee (কর্মচারী যোগ করুন)"} description="Update staff salary, designation, and contact details." loading={loading} isEditing={isEditing} maxWidth="lg">
      {staff && <input type="hidden" name="id" value={staff.id} />}
      <div className="grid grid-cols-2 gap-3">
        <Input label="Full Name *" name="name" required defaultValue={staff?.name || ""} placeholder="e.g. Md. Rahim" />
        <Input label="Mobile Phone *" name="phone" required defaultValue={staff?.phone || ""} placeholder="01700000000" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select label="Department *" name="departmentId" required defaultValue={staff ? departments.find(d => d.name === staff.departmentName)?.id : ""} options={deptOptions} placeholder="Select department" />
        <Input label="Designation *" name="designation" required defaultValue={staff?.designation || ""} placeholder="e.g. Senior Cashier" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Input label="Joining Date *" name="joiningDate" type="date" required defaultValue={staff?.joiningDate ? new Date(staff.joiningDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]} />
        <Input label="Basic Salary *" name="basicSalary" type="number" step="0.01" required defaultValue={staff?.basicSalary ?? 15000} />
        <Select label="Status" name="status" defaultValue={staff?.status || "ACTIVE"} options={[{ label: "Active", value: "ACTIVE" }, { label: "Inactive", value: "INACTIVE" }, { label: "Terminated", value: "TERMINATED" }]} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="NID Number" name="nidNumber" defaultValue={staff?.nidNumber || ""} placeholder="National ID Card Number" />
        <Input label="Emergency Phone" name="emergencyPhone" defaultValue={staff?.emergencyPhone || ""} placeholder="Family contact number" />
      </div>
      <Textarea label="Permanent Address" name="address" rows={2} defaultValue={staff?.address || ""} />
    </FormModal>
  );
}