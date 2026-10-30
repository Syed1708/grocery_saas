"use client";

import FormModal from "@/components/common/FormModal";
import { Input } from "@/components/common/ui/Input";
import { Select } from "@/components/common/ui/Select";
import { Textarea } from "@/components/common/ui/Textarea";
import { IPartner } from "@/types/partner";

const TRANSACTION_TYPES = [
  { value: "CASH_DRAWING", label: "ক্যাশ ড্রয়ার থেকে উত্তোলন (Cash Drawing)" },
  { value: "BANK_DRAWING", label: "ব্যাংক অ্যাকাউন্ট থেকে উত্তোলন (Bank Drawing)" },
  { value: "HOUSEHOLD_EXPENSE", label: "পারিবারিক খরচ/বিল পরিশোধ (Household Bill)" },
  { value: "CAPITAL_INJECTION", label: "নতুন মূলধন জমা প্রদান (Capital Injection)" },
];

export default function DrawingModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  partners,
  accounts,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  loading?: boolean;
  partners: IPartner[];
  accounts: { id: string; name: string; currentBalance: number }[];
}) {
  const partnerOptions = partners.map((p) => ({
    value: p.id,
    label: `${p.name} (${p.relationship})`,
  }));

  const accountOptions = accounts.map((a) => ({
    value: a.id,
    label: `${a.name} (ব্যালেন্স: ৳${a.currentBalance.toLocaleString()})`,
  }));

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title="পারিবারিক উত্তোলন বা মূলধন লেনদেন"
      description="উত্তোলিত টাকা নির্ধারিত ক্যাশ বা ব্যাংক অ্যাকাউন্ট থেকে সমন্বয় হবে।"
      loading={loading}
      submitLabel="নিশ্চিত করুন"
      maxWidth="lg"
    >
      <div className="space-y-4">
        <Select
          label="অংশীদার নির্বাচন করুন"
          name="partnerId"
          options={partnerOptions}
          required
        />

        <Select
          label="লেনদেনের ধরন"
          name="type"
          defaultValue="CASH_DRAWING"
          options={TRANSACTION_TYPES}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="টাকার পরিমাণ (৳)"
            name="amount"
            type="number"
            step="0.01"
            required
            placeholder="যেমন: 5000"
          />
          <Select
            label="উৎস অ্যাকাউন্ট"
            name="accountId"
            options={accountOptions}
            required
          />
        </div>

        <Input
          label="খাত বা উদ্দেশ্য"
          name="purpose"
          required
          placeholder="যেমন: বাবার চিকিৎসা খরচ / বাসার বিদ্যুৎ বিল"
        />

        <Textarea
          label="অতিরিক্ত নোট বা বিবরণ"
          name="notes"
          placeholder="কোনো বিশেষ মন্তব্য বা রশিদ নম্বর থাকলে লিখুন..."
          rows={2}
        />
      </div>
    </FormModal>
  );
}