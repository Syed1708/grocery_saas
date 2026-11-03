"use client";

import FormModal from "@/components/common/FormModal";
import { ISupplier } from "@/types";

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  editingSupplier?: ISupplier | null;
  loading?: boolean;
  currencySymbol?: string;
}

export default function SupplierModal({
  isOpen,
  onClose,
  onSubmit,
  editingSupplier = null,
  loading = false,
  currencySymbol = "৳",
}: SupplierModalProps) {
  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title={editingSupplier ? "সাপ্লায়ার তথ্য সম্পাদনা (Edit Supplier)" : "নতুন সরবরাহকারী যোগ (Register New Supplier)"}
      description="স্টক সরবরাহকারী প্রতিষ্ঠান, প্রতিনিধি ও বকেয়া খাতার বিবরণ লিখুন।"
      isEditing={Boolean(editingSupplier)}
      loading={loading}
      submitLabel={editingSupplier ? "আপডেট করুন" : "যোগ করুন"}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {editingSupplier?.id && (
          <input type="hidden" name="id" value={editingSupplier.id} />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              কোম্পানি বা পরিবেশক প্রতিষ্ঠান (Company Name) *
            </label>
            <input
              type="text"
              name="companyName"
              required
              defaultValue={editingSupplier?.companyName || ""}
              placeholder="e.g. Unilever Bangladesh Ltd."
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              যোগাযোগকারী প্রতিনিধি (Contact Person / SR) *
            </label>
            <input
              type="text"
              name="name"
              required
              defaultValue={editingSupplier?.name || ""}
              placeholder="e.g. মোঃ তারিকুল ইসলাম (SR)"
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              মোবাইল নম্বর *
            </label>
            <input
              type="text"
              name="phone"
              required
              defaultValue={editingSupplier?.phone || ""}
              placeholder="01700000000"
              className="w-full px-3 py-2 text-xs font-mono border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {!editingSupplier && (
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                পূর্বের বকেয়া দেনা ({currencySymbol})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="openingBalance"
                defaultValue={0}
                placeholder="0.00"
                className="w-full px-3 py-2 text-xs font-mono border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
            ঠিকানা বা ডিপো লোকেশন (Address)
          </label>
          <input
            type="text"
            name="addressLine"
            defaultValue={editingSupplier?.address || ""}
            placeholder="প্লট-৪, তেজগাঁও শিল্পাঞ্চল, ঢাকা..."
            className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Multi-Branch Corporate Scope Toggle */}
        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              name="isGlobal"
              value="true"
              defaultChecked={editingSupplier ? !editingSupplier.branchId : false}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer"
            />
            <div>
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block">
                সকল শাখার জন্য প্রযোজ্য (Global Corporate Supplier)
              </span>
              <span className="text-[10px] text-neutral-400 block">
                প্রাণ, ইউনিলিভার, স্কয়ারের মতো প্রধান ব্র্যান্ডের জন্য চালু রাখুন যেন সকল ব্রাঞ্চ থেকে এই সাপ্লায়ারে চালান ইনওয়ার্ড করা যায়।
              </span>
            </div>
          </label>
        </div>
      </div>
    </FormModal>
  );
}