"use client";
import FormModal from "@/components/common/FormModal";
import { Input } from "@/components/common/ui/Input";
import { Select } from "@/components/common/ui/Select";
import { Textarea } from "@/components/common/ui/Textarea";
import { IExpenseCategory } from "@/types";

export default function ExpenseCategoryModal({ isOpen, onClose, onSubmit, loading, category }: { isOpen: boolean; onClose: () => void; onSubmit: (e: any) => void; loading: boolean; category?: IExpenseCategory | null }) {
  const isEditing = Boolean(category);
  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={onSubmit} title={isEditing ? "Edit Expense Type" : "Add Expense Type (খরচের খাত)"} description="Create category for daily shop costs (e.g. Electricity, Rent)." loading={loading} isEditing={isEditing}>
      {category && <input type="hidden" name="id" value={category.id} />}
      <Input label="Category Name" name="name" required defaultValue={category?.name || ""} placeholder="e.g. Electric Bill, Rent" />
      <Input label="Category Code" name="code" required defaultValue={category?.code || ""} placeholder="e.g. EXP-ELEC" />
      <Select label="Status" name="status" defaultValue={category?.status || "active"} options={[{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }]} />
      <Textarea label="Description" name="description" rows={2} defaultValue={category?.description || ""} />
    </FormModal>
  );
}