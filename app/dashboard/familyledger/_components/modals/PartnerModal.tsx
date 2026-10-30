"use client";

import FormModal from "@/components/common/FormModal";
import { Input } from "@/components/common/ui/Input";
import { Select } from "@/components/common/ui/Select";
import { Textarea } from "@/components/common/ui/Textarea";
import { IPartner } from "@/types/partner";

const RELATIONSHIP_OPTIONS = [
  { value: "FATHER", label: "বাবা (Father)" },
  { value: "UNCLE", label: "চাচা (Uncle)" },
  { value: "BROTHER", label: "ভাই (Brother)" },
  { value: "SELF", label: "নিজে (Self)" },
  { value: "OTHER", label: "অন্যান্য (Partner)" },
];

export default function PartnerModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  partner,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  loading?: boolean;
  partner?: IPartner | null;
}) {
  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title={partner ? "পার্টনার প্রোফাইল সম্পাদনা" : "নতুন অংশীদার (পার্টনার) যোগ"}
      description="পারিবারিক অংশীদার ও তাদের প্রাথমিক বিনিয়োগ রেকর্ড করুন।"
      loading={loading}
      isEditing={Boolean(partner)}
      submitLabel={partner ? "আপডেট করুন" : "যোগ করুন"}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {partner?.id && <input type="hidden" name="id" value={partner.id} />}

        <Input
          label="পূর্ণ নাম"
          name="name"
          defaultValue={partner?.name}
          required
          placeholder="যেমন: হাজী আব্দুল করিম"
        />

        <Select
          label="পারিবারিক সম্পর্ক"
          name="relationship"
          defaultValue={partner?.relationship || "UNCLE"}
          options={RELATIONSHIP_OPTIONS}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="ইকুইটি শেয়ার শতকরা (%)"
            name="equityPercent"
            type="number"
            step="0.01"
            defaultValue={partner?.equityPercent || 0}
            placeholder="যেমন: 25"
          />
          <Input
            label="প্রাথমিক বিনিয়োগ মূলধন (৳)"
            name="openingCapital"
            type="number"
            defaultValue={partner?.openingCapital || 0}
            placeholder="যেমন: 500000"
          />
        </div>

        <Input
          label="মোবাইল নম্বর"
          name="phone"
          defaultValue={partner?.phone || ""}
          placeholder="017xxxxxxxx"
        />

        <Textarea
          label="নোট বা বিশেষ শর্তাবলী (ঐচ্ছিক)"
          name="notes"
          defaultValue={partner?.notes || ""}
          placeholder="অংশীদারের বিশেষ চুক্তি বা তথ্য থাকলে লিখুন..."
          rows={3}
        />
      </div>
    </FormModal>
  );
}