"use client";

import React from "react";
import FormModal from "@/components/common/FormModal";
import { ExtraOption } from "../ProductsClient";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => Promise<void>;
  editingSection: ExtraOption | null;
  loading: boolean;
}

export default function SectionModal({ isOpen, onClose, onSubmit, editingSection, loading }: Props) {
  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title={editingSection ? "তাক বা সেকশন সম্পাদনা" : "নতুন তাক তৈরি"}
      description="দোকানের ডিসপ্লে তাক ও কোড কনফিগার করুন।"
      isEditing={Boolean(editingSection)}
      loading={loading}
      maxWidth="md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold mb-1">তাকের নাম *</label>
          <input
            type="text"
            name="name"
            required
            defaultValue={editingSection?.name || ""}
            placeholder="যেমন: তাক নং ০১ (সামনের ডিসপ্লে)"
            className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">তাক কোড (Shelf Code)</label>
          <input
            type="text"
            name="code"
            defaultValue={editingSection?.code || ""}
            placeholder="e.g. SH-01"
            className="w-full px-3 py-2 text-xs border rounded-xl font-mono uppercase outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">বিবরণ / অবস্থান</label>
          <input
            type="text"
            name="description"
            defaultValue={editingSection?.description || ""}
            placeholder="দোকানের সামনের প্রধান ডিসপ্লে তাক..."
            className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800"
          />
        </div>
      </div>
    </FormModal>
  );
}