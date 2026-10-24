"use client";

import { useState } from "react";
import { Plus, Edit2 } from "lucide-react";
import { toast } from "sonner";
import FormModal from "@/components/common/FormModal";
import CategoryForm from "./CategoryForm"; // 👈 Reuses our clean form component
import { createCategoryAction, updateCategoryAction } from "@/app/actions/category-actions";
import { ICategory } from "@/types";

interface CategoryDialogProps {
  category?: ICategory | null;
  mode: "create" | "edit";
}

export default function CategoryDialog({ category, mode }: CategoryDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    if (mode === "edit" && category?.id) {
      formData.append("id", category.id.toString());
    }

    const res = mode === "create"
      ? await createCategoryAction(formData)
      : await updateCategoryAction(formData);

    setLoading(false);

    if (res.success) {
      toast.success(
        mode === "create" ? "Category created successfully!" : "Category updated successfully!"
      );
      setIsOpen(false);
    } else {
      toast.error(res.error || "An error occurred");
    }
  }

  return (
    <>
      {mode === "create" ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
        >
          <Plus size={16} /> Add Category
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
          title="Edit"
        >
          <Edit2 size={15} />
        </button>
      )}

      {/* 👈 Reuses FormModal & CategoryForm */}
      <FormModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
        title={mode === "create" ? "Create New Category" : "Edit Category"}
        description="Categories group products together on the POS cash register."
        isEditing={mode === "edit"}
        loading={loading}
      >
        <CategoryForm editingCategory={category} />
      </FormModal>
    </>
  );
}