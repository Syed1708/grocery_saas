"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteCategoryAction } from "@/app/actions/category-actions";

export default function DeleteCategoryButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this category?")) return;

    setLoading(true);
    const res = await deleteCategoryAction(id);
    setLoading(false);

    if (!res.success) {
      alert(res.error || "Failed to delete");
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50 cursor-pointer"
      title="Delete"
    >
      <Trash2 size={16} />
    </button>
  );
}