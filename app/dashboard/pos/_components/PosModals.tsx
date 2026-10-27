"use client";

import { useState } from "react";
import FormModal from "@/components/common/FormModal";
import Modal from "@/components/common/Modal";
import { CheckCircle2, Printer } from "lucide-react";
import { createCustomerAction } from "@/app/actions/customer-actions";
import { toast } from "sonner";
import PosReceiptThermalPrint from "./PosReceiptThermalPrint";

interface PosModalsProps {
  customerModalOpen: boolean;
  onCloseCustomerModal: () => void;
  completedSale: any | null;
  onCloseCompletedSale: () => void;
  shop: any;
}

export default function PosModals({
  customerModalOpen,
  onCloseCustomerModal,
  completedSale,
  onCloseCompletedSale,
  shop,
}: PosModalsProps) {
  const [loading, setLoading] = useState(false);

  async function handleQuickCustomer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await createCustomerAction(formData);
    setLoading(false);

    if (res.success) {
      toast.success("নতুন কাস্টমার যোগ করা হয়েছে!");
      onCloseCustomerModal();
    } else {
      toast.error(res.error || "কাস্টমার যোগ করা সম্ভব হয়নি।");
    }
  }

  // 👈 Popup-free native print trigger
  function handlePrintReceipt() {
    window.print();
  }

  return (
    <>
      {/* 1. Quick Add Customer Modal */}
      <FormModal
        isOpen={customerModalOpen}
        onClose={onCloseCustomerModal}
        onSubmit={handleQuickCustomer}
        title="নতুন কাস্টমার যুক্ত করুন (Quick Add Customer)"
        description="Add customer phone and credit limit directly from the cash counter."
        loading={loading}
        submitLabel="কাস্টমার সংরক্ষণ করুন"
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              কাস্টমারের নাম *
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g. মোশাররফ হোসেন"
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              মোবাইল নম্বর *
            </label>
            <input
              type="text"
              name="phone"
              required
              placeholder="01700000000"
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              বাকি লিমিট (Credit Limit ৳)
            </label>
            <input
              type="number"
              name="creditLimit"
              defaultValue={5000}
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono"
            />
          </div>
        </div>
      </FormModal>

      {/* 2. Completed Sale & Print Modal */}
      {completedSale && (
        <Modal
          isOpen={Boolean(completedSale)}
          onClose={onCloseCompletedSale}
          title="বিক্রয় সফল হয়েছে! (Sale Completed)"
          description={`ইনভয়েস নং: #${completedSale.invoiceNo}`}
          maxWidth="sm"
        >
          <div className="space-y-4 text-center">
            <div className="inline-flex p-3 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600">
              <CheckCircle2 size={32} />
            </div>

            <div>
              <span className="text-2xl font-black text-neutral-900 dark:text-neutral-100 block font-mono">
                {shop?.currencySymbol || "৳"}{completedSale.grandTotal.toFixed(2)}
              </span>
              {completedSale.changeAmount > 0 && (
                <span className="text-xs text-emerald-600 font-bold block mt-1">
                  ফেরত দিতে হবে: {shop?.currencySymbol || "৳"}{completedSale.changeAmount.toFixed(2)}
                </span>
              )}
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer size={15} /> প্রিন্ট রসিদ ({shop?.thermalWidth || "80mm"})
              </button>
              <button
                type="button"
                onClick={onCloseCompletedSale}
                className="w-full py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold text-xs rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition cursor-pointer"
              >
                নতুন বিক্রয় (Next Customer)
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 3. Separate Thermal Print Engine */}
      <PosReceiptThermalPrint sale={completedSale} shop={shop} />
    </>
  );
}