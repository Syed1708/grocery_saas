"use client";
import FormModal from "@/components/common/FormModal";
import { FormField } from "@/components/common/ui/form/FormField";
import { IDepartment } from "@/types";

export default function DepartmentModal({ isOpen, onClose, onSubmit, loading, department, errors = {} }: { isOpen: boolean; onClose: () => void; onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void; loading: boolean; department?: IDepartment | null; errors?: Record<string, string> }) {
  const isEditing = Boolean(department);
  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={onSubmit} title={isEditing ? "Edit Department" : "Add Department (বিভাগ)"} description="Create department for store staff classification." loading={loading} isEditing={isEditing}>
      {department && <input type="hidden" name="id" value={department.id} />}
      <FormField type="text" label="Department Name" name="name" required defaultValue={department?.name || ""} placeholder="e.g. Sales Counter" error={errors.name} />
      <FormField type="text" label="Department Code" name="code" required defaultValue={department?.code || ""} placeholder="e.g. SALES" error={errors.code} />
      <FormField type="select" label="Status" name="status" defaultValue={department?.status || "active"} options={[{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }]} error={errors.status} />
      <FormField type="textarea" label="Description" name="description" rows={2} defaultValue={department?.description || ""} error={errors.description} />
    </FormModal>
  );
}
