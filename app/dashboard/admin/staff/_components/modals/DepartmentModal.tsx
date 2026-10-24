"use client";
import FormModal from "@/components/common/FormModal";
import { Input } from "@/components/common/ui/Input";
import { Select } from "@/components/common/ui/Select";
import { Textarea } from "@/components/common/ui/Textarea";
import { IDepartment } from "@/types";

export default function DepartmentModal({ isOpen, onClose, onSubmit, loading, department }: { isOpen: boolean; onClose: () => void; onSubmit: (e: any) => void; loading: boolean; department?: IDepartment | null }) {
  const isEditing = Boolean(department);
  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={onSubmit} title={isEditing ? "Edit Department" : "Add Department (বিভাগ)"} description="Create department for store staff classification." loading={loading} isEditing={isEditing}>
      {department && <input type="hidden" name="id" value={department.id} />}
      <Input label="Department Name" name="name" required defaultValue={department?.name || ""} placeholder="e.g. Sales Counter" />
      <Input label="Department Code" name="code" required defaultValue={department?.code || ""} placeholder="e.g. SALES" />
      <Select label="Status" name="status" defaultValue={department?.status || "active"} options={[{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }]} />
      <Textarea label="Description" name="description" rows={2} defaultValue={department?.description || ""} />
    </FormModal>
  );
}