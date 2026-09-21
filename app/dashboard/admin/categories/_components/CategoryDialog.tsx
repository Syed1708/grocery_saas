"use client";

import { useState } from "react";
import { Plus, Edit2, X } from "lucide-react";
import { createCategoryAction, updateCategoryAction } from "@/app/actions/category-actions";
import { ICategory } from "@/types/category";

interface CategoryDialogProps {
  category?: ICategory;
  mode: "create" | "edit";
}

export default function CategoryDialog({ category, mode }: CategoryDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    if (mode === "edit" && category?._id) {
      formData.append("id", category._id.toString());
    }

    const res = mode === "create"
      ? await createCategoryAction(formData)
      : await updateCategoryAction(formData);

    setLoading(false);

    if (res.success) {
      setIsOpen(false);
    } else {
      setError(res.error || "An error occurred");
    }
  }

  return (
    <>
      {mode === "create" ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow transition cursor-pointer"
        >
          <Plus size={18} /> Add Category
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded transition cursor-pointer"
          title="Edit"
        >
          <Edit2 size={16} />
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {mode === "create" ? "Create New Category" : "Edit Category"}
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={category?.name || ""}
                  placeholder="e.g. Dairy & Eggs"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  name="image"
                  defaultValue={category?.image || ""}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={category?.description || ""}
                  placeholder="Short description..."
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Saving..." : mode === "create" ? "Create" : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}