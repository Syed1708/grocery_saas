"use client";

import React from "react";
import { ICategory } from "@/types";
import { FormField } from "@/components/common/ui/form/FormField";

interface Props {
  category: ICategory | null;
  errors?: Record<string, string>; // 👈 Accept errors from useCrudModal
}

export default function CategoryForm({ category, errors = {} }: Props) {
  return (
    <div className="space-y-4">
      {/* Name Input with Error Binding */}
      <FormField
        type="text"
        label="ক্যাটাগরির নাম"
        name="name"
        required
        defaultValue={category?.name}
        placeholder="যেমন: ডেইরি ও ডিম"
        error={errors.name} // 👈 Turns border red & shows error message!
      />

      {/* Status Dropdown */}
      <FormField
        type="select"
        label="স্ট্যাটাস"
        name="status"
        defaultValue={category?.status || "active"}
        error={errors.status}
        options={[
          { label: "সক্রিয় (Active)", value: "active" },
          { label: "নিষ্ক্রিয় (Inactive)", value: "inactive" },
        ]}
      />

      {/* Description Textarea */}
      <FormField
        type="textarea"
        label="বিবরণ"
        name="description"
        defaultValue={category?.description}
        placeholder="সংক্ষিপ্ত বিবরণ লিখুন..."
        error={errors.description}
      />

      {/* Image Upload (Single clean label + error check) */}
      <FormField
        type="image"
        label="ক্যাটাগরির ছবি"
        name="image"
        defaultValue={category?.image}
        hint="সর্বোচ্চ ৫ মেগাবাইট (JPG, PNG, WEBP)"
        error={errors.image} // 👈 Highlights if image size exceeds limit
      />
    </div>
  );
}