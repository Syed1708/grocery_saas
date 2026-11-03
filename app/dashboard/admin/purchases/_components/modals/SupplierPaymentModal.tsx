"use client";

import { useState } from "react";
import { toast } from "sonner";
import FormModal from "@/components/common/FormModal";
import { recordSupplierPaymentAction } from "@/app/actions/supplier-actions";
import { ISupplier } from "@/types";
import { Input } from "@/components/common/ui/Input";
import { Select } from "@/components/common/ui/Select";

interface Props {
  supplier: ISupplier | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentData: any) => void;
  currencySymbol?: string;
}

export default function SupplierPaymentModal({
  supplier,
  isOpen,
  onClose,
  onSuccess,
  currencySymbol = "৳",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState<number>(0);

  if (!supplier) return null;

  const currentDue = Number(supplier.currentDue || 0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (amount <= 0) return toast.error("পরিশোধের পরিমাণ উল্লেখ করুন।");

    setLoading(true);
    const formData = new FormData(e.currentTarget);

    const res = await recordSupplierPaymentAction({
      supplierId: supplier.id,
      amount,
      paymentMethod: formData.get("paymentMethod")?.toString() || "cash",
      reference: formData.get("reference")?.toString() || undefined,
      note: formData.get("note")?.toString() || undefined,
    });

    setLoading(false);

    if (res.success) {
      toast.success("বকেয়া পরিশোধ সফল হয়েছে ও ক্যাশ ড্রয়ার সমন্বয় করা হয়েছে!");
      onSuccess(res);
      onClose();
    } else {
      toast.error(res.error || "পেমেন্ট ব্যর্থ হয়েছে।");
    }
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="মহাজনের বকেয়া পরিশোধ (Supplier Due Payout)"
      description="টাকা পরিশোধ করলে স্বয়ংক্রিয়ভাবে নির্বাচিত ক্যাশ ড্রয়ার বা ব্যাংক অ্যাকাউন্ট থেকে কর্তন হবে।"
      loading={loading}
      submitLabel="পরিশোধ নিশ্চিত করুন"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Due Banner */}
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex justify-between items-center text-xs">
          <div>
            <strong className="block text-neutral-900 dark:text-neutral-100">{supplier.companyName || supplier.name}</strong>
            <span className="text-[11px] text-neutral-500">ফোন: {supplier.phone}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-rose-500 block">বর্তমান বাকি দেনা</span>
            <span className="text-base font-black font-mono text-rose-600">
              {currencySymbol}{currentDue.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Input
              label="পরিশোধের পরিমাণ *"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
              placeholder="e.g. 5000"
            />
          </div>

          <Select
            label="উৎস অ্যাকাউন্ট (Payment Method) *"
            name="paymentMethod"
            defaultValue="cash"
            options={[
              { value: "cash", label: "ক্যাশ ড্রয়ার (Cash Drawer)" },
              { value: "bank", label: "ব্যাংক অ্যাকাউন্ট (Bank)" },
              { value: "bkash", label: "বিকাশ মার্চেন্ট (bKash)" },
              { value: "nagad", label: "নগদ মার্চেন্ট (Nagad)" },
            ]}
          />
        </div>

        {/* Quick Full-Pay Button */}
        {currentDue > 0 && (
          <button
            type="button"
            onClick={() => setAmount(currentDue)}
            className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
          >
            সম্পূর্ণ বকেয়া পরিশোধ করুন ({currencySymbol}{currentDue.toFixed(2)})
          </button>
        )}

        <Input
          label="মেমো বা চেক রেফারেন্স (ঐচ্ছিক)"
          name="reference"
          placeholder="যেমন: Chalan #8912 or Cheque #1290"
        />

        <Input
          label="নোট বা বিবরণ"
          name="note"
          placeholder="পেমেন্ট সংক্রান্ত মন্তব্য..."
        />
      </div>
    </FormModal>
  );
}