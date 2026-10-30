"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import FormModal from "@/components/common/FormModal";
import { Input } from "@/components/common/ui/Input";
import { Select } from "@/components/common/ui/Select";
import { IPartner } from "@/types/partner";

export default function RationModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  partners,
  products,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { partnerId: string; items: { productId: string; quantity: number }[] }) => void;
  loading?: boolean;
  partners: IPartner[];
  products: { id: string; name: string; purchasePrice: number }[];
}) {
  const [partnerId, setPartnerId] = useState(partners[0]?.id || "");
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>([
    { productId: products[0]?.id || "", quantity: 1 },
  ]);

  const partnerOptions = partners.map((p) => ({
    value: p.id,
    label: `${p.name} (${p.relationship})`,
  }));

  const productOptions = products.map((p) => ({
    value: p.id,
    label: `${p.name} (ক্রয়মূল্য: ৳${p.purchasePrice})`,
  }));

  function addItem() {
    if (products.length > 0) {
      setItems([...items, { productId: products[0].id, quantity: 1 }]);
    }
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit({ partnerId, items });
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleFormSubmit}
      title="বাসার রেশন বা নিত্যপণ্য এন্ট্রি (কেনা মূল্যে)"
      description="নেওয়া পণ্যগুলো ক্রয়মূল্যে পার্টনার লেজারে যুক্ত হবে এবং স্টক সমন্বয় হবে।"
      loading={loading}
      submitLabel="স্টক থেকে ইস্যু করুন"
      maxWidth="xl"
    >
      <div className="space-y-4">
        <Select
          label="যার পরিবারের জন্য নেওয়া হচ্ছে"
          value={partnerId}
          onChange={(e) => setPartnerId(e.target.value)}
          options={partnerOptions}
          required
        />

        <div className="space-y-3 pt-2">
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">
            পণ্য ও পরিমাণের তালিকা
          </label>

          {items.map((it, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="flex-1">
                <Select
                  value={it.productId}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx].productId = e.target.value;
                    setItems(next);
                  }}
                  options={productOptions}
                />
              </div>

              <div className="w-28">
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={it.quantity}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx].quantity = Number(e.target.value);
                    setItems(next);
                  }}
                  placeholder="পরিমাণ"
                />
              </div>

              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="p-2 text-rose-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition cursor-pointer pt-1"
          >
            <Plus size={14} /> আরো পণ্য যোগ করুন
          </button>
        </div>
      </div>
    </FormModal>
  );
}