"use client";
import FormModal from "@/components/common/FormModal";
import { FormField } from "@/components/common/ui/form/FormField";
import { IExpenseCategory } from "@/types";

export default function ExpenseCategoryModal({ isOpen, onClose, onSubmit, loading, category, errors = {} }: { isOpen: boolean; onClose: () => void; onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void; loading: boolean; category?: IExpenseCategory | null; errors?: Record<string, string> }) {
  const isEditing = Boolean(category);
  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={onSubmit} title={isEditing ? "Edit Expense Type" : "Add Expense Type (খরচের খাত)"} description="Create category for daily shop costs (e.g. Electricity, Rent)." loading={loading} isEditing={isEditing}>
      {category && <input type="hidden" name="id" value={category.id} />}
      <FormField type="text" label="Category Name" name="name" required defaultValue={category?.name || ""} placeholder="e.g. Electric Bill, Rent" error={errors.name} />
      <FormField type="text" label="Category Code" name="code" required defaultValue={category?.code || ""} placeholder="e.g. EXP-ELEC" error={errors.code} />
      <FormField type="select" label="Status" name="status" defaultValue={category?.status || "active"} options={[{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }]} error={errors.status} />
      <FormField type="textarea" label="Description" name="description" rows={2} defaultValue={category?.description || ""} error={errors.description} />
    </FormModal>
  );
}
