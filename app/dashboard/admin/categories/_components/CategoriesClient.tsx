"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";
import Modal from "@/components/common/Modal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ImageUpload from "@/components/common/ImageUpload";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "@/app/actions/category-actions";

interface CategoryData {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  createdAt: Date;
}

export default function CategoriesClient({ data }: { data: CategoryData[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function openCreate() {
    setEditingCategory(null);
    setError("");
    setModalOpen(true);
  }

  function openEdit(category: CategoryData) {
    setEditingCategory(category);
    setError("");
    setModalOpen(true);
  }

  async function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    if (editingCategory) {
      formData.append("id", editingCategory.id);
    }

    const res = editingCategory
      ? await updateCategoryAction(formData)
      : await createCategoryAction(formData);

    setLoading(false);
    if (res.success) {
      setModalOpen(false);
    } else {
      setError(res.error || "Operation failed.");
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setLoading(true);
    const res = await deleteCategoryAction(deleteTarget.id);
    setLoading(false);
    if (res.success) {
      setDeleteTarget(null);
    } else {
      alert(res.error || "Failed to delete.");
    }
  }

  // Define Table Columns
  const columns: ColumnDef<CategoryData>[] = [
    {
      accessorKey: "image",
      header: "Photo",
      enableHiding: false,
      cell: ({ row }) => {
        const image = row.getValue("image") as string | null;
        return (
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center">
            {image ? (
              <img src={image} alt="Cat" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm">🏷️</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: "Category Name",
      cell: ({ row }) => (
        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
          {row.getValue("name")}
        </span>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="text-neutral-500 dark:text-neutral-400 truncate max-w-xs block">
          {row.getValue("description") || "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        const cat = row.original;
        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => openEdit(cat)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="Edit"
            >
              <Edit2 size={15} />
            </button>
            <button
              onClick={() => setDeleteTarget(cat)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="Delete"
            >
              <Trash2 size={15} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            Categories
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Organize products with images and fast POS lookups
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Generic Data Table */}
      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder="Search categories..."
      />

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? "Edit Category" : "New Category"}
        description="Categories group products together on the POS cash register."
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              name="name"
              required
              defaultValue={editingCategory?.name || ""}
              placeholder="e.g. Dairy & Eggs"
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              name="description"
              rows={2}
              defaultValue={editingCategory?.description || ""}
              placeholder="Short description..."
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Generic Image Upload with Live Preview */}
          <ImageUpload
            name="image"
            defaultImage={editingCategory?.image}
            label="Category Thumbnail"
          />

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Saving..." : editingCategory ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Generic Confirmation Dialog for Deletion */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Its image file will also be permanently removed from disk.`}
        confirmLabel="Delete Category"
        loading={loading}
      />
    </>
  );
}