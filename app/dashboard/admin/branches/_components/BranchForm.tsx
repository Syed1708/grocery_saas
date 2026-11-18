"use client";

import { IBranchWithCounts } from "@/types/branch";
import { FormField } from "@/components/common/ui/form/FormField";

interface Props {
  branch: IBranchWithCounts | null;
  errors?: Record<string, string>;
}

export default function BranchForm({ branch, errors = {} }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          type="text"
          label="শাখার নাম"
          name="name"
          required
          defaultValue={branch?.name || ""}
          placeholder="e.g. ধানমন্ডি আউটলেট"
          error={errors.name}
        />

        <FormField
          type="text"
          label="শাখা কোড"
          name="code"
          required
          defaultValue={branch?.code || ""}
          placeholder="e.g. DHN-01"
          className="font-mono uppercase"
          error={errors.code}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          type="text"
          label="যোগাযোগ মোবাইল"
          name="phone"
          defaultValue={branch?.phone || ""}
          placeholder="017xxxxxxxx"
          error={errors.phone}
        />

        <FormField
          type="select"
          label="স্ট্যাটাস"
          name="status"
          defaultValue={branch?.status || "active"}
          options={[
            { label: "সক্রিয় (Active)", value: "active" },
            { label: "নিষ্ক্রিয় (Inactive)", value: "inactive" },
          ]}
          error={errors.status}
        />
      </div>

      <FormField
        type="text"
        label="শাখার ঠিকানা"
        name="address"
        defaultValue={branch?.address || ""}
        placeholder="বাড়ি ১২, রোড ২৭, ধানমন্ডি, ঢাকা"
        error={errors.address}
      />

      <div className="pt-2">
        <FormField
          type="checkbox"
          label="প্রধান শাখা হিসেবে নির্ধারণ করুন (Principal Main Branch)"
          name="isMain"
          defaultValue={branch?.isMain || false}
          error={errors.isMain}
        />
      </div>
    </div>
  );
}
