"use client";

import React from "react";
import FormModal from "@/components/common/FormModal";
import { ExtraOption } from "../ProductsClient";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => Promise<void>;
  editingBrand: ExtraOption | null;
  loading: boolean;
}

export default function BrandModal({
  isOpen,
  onClose,
  onSubmit,
  editingBrand,
  loading,
}: Props) {
  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title={editingBrand ? "ব্র্যান্ড তথ্য সম্পাদনা" : "নতুন ব্র্যান্ড যোগ"}
      description="উৎপাদক বা পরিবেশক কোম্পানির তথ্য যুক্ত করুন।"
      isEditing={Boolean(editingBrand)}
      loading={loading}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Brand Name & Status Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1">
              ব্র্যান্ড নাম *
            </label>
            <input
              type="text"
              name="name"
              required
              defaultValue={editingBrand?.name || ""}
              placeholder="যেমন: Pran Foods"
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800"
            />
          </div>

          {/* 👈 Added: Brand Status Selector */}
          <div>
            <label className="block text-xs font-semibold mb-1">
              স্ট্যাটাস (Status) *
            </label>
            <select
              name="status"
              defaultValue={editingBrand?.status || "active"}
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 cursor-pointer"
            >
              <option value="active">সক্রিয় (Active)</option>
              <option value="inactive">নিষ্ক্রিয় (Inactive)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">
            কোম্পানি / পরিবেশক প্রতিষ্ঠান
          </label>
          <input
            type="text"
            name="companyName"
            defaultValue={editingBrand?.companyName || ""}
            placeholder="যেমন: প্রাণ-আরএফএল গ্রুপ"
            className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1">
              বিক্রয় প্রতিনিধি (SR Name)
            </label>
            <input
              type="text"
              name="contactPerson"
              defaultValue={editingBrand?.contactPerson || ""}
              placeholder="যেমন: মোঃ রফিকুল ইসলাম"
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              SR মোবাইল নম্বর
            </label>
            <input
              type="text"
              name="phone"
              defaultValue={editingBrand?.phone || ""}
              placeholder="017xxxxxxxx"
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono bg-white dark:bg-neutral-800"
            />
          </div>
        </div>
      </div>
    </FormModal>
  );
}