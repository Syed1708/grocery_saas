"use client";

import { Input } from "@/components/common/ui/Input";
import { Select } from "@/components/common/ui/Select";
import { Textarea } from "@/components/common/ui/Textarea";
import ImageUpload from "@/components/common/ImageUpload";
import { ICategory } from "@/types";

interface CategoryFormProps {
  editingCategory?: ICategory | null;
}

export default function CategoryForm({ editingCategory }: CategoryFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Category Name"
          name="name"
          required
          defaultValue={editingCategory?.name || ""}
          placeholder="e.g. Dairy & Eggs"
        />

        {/* 👈 Added Status Dropdown */}
        <Select
          label="Status"
          name="status"
          defaultValue={editingCategory?.status || "active"}
          options={[
            { label: "Active (Visible on POS)", value: "active" },
            { label: "Inactive (Hidden)", value: "inactive" },
          ]}
        />
      </div>

      <Textarea
        label="Description (Optional)"
        name="description"
        rows={2}
        defaultValue={editingCategory?.description || ""}
        placeholder="Short details about this item group..."
      />

      <ImageUpload
        name="image"
        defaultImage={editingCategory?.image}
        label="Category Thumbnail Photo"
      />
    </div>
  );
}