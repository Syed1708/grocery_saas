"use client";

import { FormField } from "@/components/common/ui/form/FormField";

interface Props {
  errors?: Record<string, string>;
}

export default function UnitForm({ errors = {} }: Props) {
  return (
    <div className="space-y-4">
      <FormField
        type="text"
        label="Unit Name"
        name="name"
        required
        placeholder="e.g. Carton, Sachet, Tin"
        error={errors.name}
      />

      <FormField
        type="text"
        label="Short Code / Symbol"
        name="code"
        required
        placeholder="e.g. ctn, sch, tin"
        className="font-mono uppercase"
        error={errors.code}
      />
    </div>
  );
}
