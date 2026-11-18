"use client";

import { ICustomer } from "@/types";
import { FormField } from "@/components/common/ui/form/FormField";

interface Props {
  customer: ICustomer | null;
  currencySymbol: string;
  errors?: Record<string, string>;
}

export default function CustomerForm({ customer, currencySymbol, errors = {} }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          type="text"
          label="কাস্টমারের পূর্ণ নাম"
          name="name"
          required
          defaultValue={customer?.name || ""}
          placeholder="যেমন: হাজী মোশাররফ হোসেন"
          error={errors.name}
        />

        <FormField
          type="text"
          label="মোবাইল নম্বর"
          name="phone"
          defaultValue={customer?.phone || ""}
          placeholder="017xxxxxxxx"
          className="font-mono"
          error={errors.phone}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <FormField
          type="select"
          label="কাস্টমার টাইপ"
          name="type"
          defaultValue={customer?.type || "PERMANENT"}
          options={[
            { label: "স্থায়ী খাতা (Credit Ledger)", value: "PERMANENT" },
            { label: "খুচরা ক্রেতা (Cash Only)", value: "WALK_IN" },
          ]}
          error={errors.type}
        />

        <FormField
          type="text"
          label="গ্রাম বা এলাকা"
          name="village"
          defaultValue={customer?.village || ""}
          placeholder="যেমন: মোল্লাপাড়া, রোড-২"
          error={errors.village}
        />

        <FormField
          type="text"
          label="জেলা"
          name="district"
          defaultValue={customer?.district || ""}
          placeholder="যেমন: ঢাকা"
          error={errors.district}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          type="number"
          label={`বাকি লিমিট (${currencySymbol})`}
          name="creditLimit"
          step="0.01"
          min="0"
          defaultValue={customer?.creditLimit ?? 5000}
          placeholder="5000.00"
          className="font-mono"
          error={errors.creditLimit}
        />

        {!customer && (
          <FormField
            type="number"
            label={`পূর্বের বকেয়া ব্যালেন্স (${currencySymbol})`}
            name="openingBalance"
            step="0.01"
            min="0"
            defaultValue={0}
            placeholder="0.00"
            hint="খাতার পূর্বে কোনো বাকি থাকলে লিখুন"
            className="font-mono"
            error={errors.openingBalance}
          />
        )}
      </div>

      <FormField
        type="text"
        label="ঠিকানা বা নোট"
        name="addressLine"
        defaultValue={customer?.addressLine || customer?.address || ""}
        placeholder="দোকান নং ৫, বাজার রোড..."
        error={errors.addressLine}
      />
    </div>
  );
}
