"use client";

import { useState } from "react";
import FormModal from "@/components/common/FormModal";
import Modal from "@/components/common/Modal";
import { CheckCircle2, Printer } from "lucide-react";
import { toast } from "sonner";
import PosReceiptThermalPrint from "./PosReceiptThermalPrint";
import { ICompletedSale, IPosShopConfig } from "@/types/sale";
import { createCustomerAction } from "@/app/actions/customer-actions";

interface PosModalsProps {
  customerModalOpen: boolean;
  onCloseCustomerModal: () => void;
  completedSale: ICompletedSale | null;
  onCloseCompletedSale: () => void;
  shop: IPosShopConfig;
  onCustomerCreated?: (customerId: string) => void;
}

export default function PosModals({
  customerModalOpen,
  onCloseCustomerModal,
  completedSale,
  onCloseCompletedSale,
  shop,
  onCustomerCreated,
}: PosModalsProps) {
  const [loading, setLoading] = useState(false);

  async function handleQuickCustomer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await createCustomerAction(formData);
    setLoading(false);

    if (res.success && res.customerId) {
      toast.success("নতুন কাস্টমার যোগ করা হয়েছে!");
      if (onCustomerCreated) onCustomerCreated(res.customerId);
      onCloseCustomerModal();
    } else {
      toast.error(res.error || "কাস্টমার যোগ করা সম্ভব হয়নি।");
    }
  }

  return (
    <>
      <FormModal
        isOpen={customerModalOpen}
        onClose={onCloseCustomerModal}
        onSubmit={handleQuickCustomer}
        title="নতুন কাস্টমার যোগ করুন"
        description="কাউন্টার থেকেই কাস্টমার ও বাকি লিমিট নিবন্ধন করুন।"
        loading={loading}
        submitLabel="কাস্টমার সংরক্ষণ করুন"
        maxWidth="md"
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1">কাস্টমারের নাম *</label>
            <input type="text" name="name" required placeholder="যেমন: মোশাররফ হোসেন" className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">মোবাইল নম্বর *</label>
            <input type="text" name="phone" required placeholder="017xxxxxxxx" className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono dark:bg-neutral-800" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">বাকি লিমিট (৳)</label>
            <input type="number" name="creditLimit" defaultValue={5000} min="0" className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono dark:bg-neutral-800" />
          </div>
        </div>
      </FormModal>

      {completedSale && (
        <Modal
          isOpen={Boolean(completedSale)}
          onClose={onCloseCompletedSale}
          title="বিক্রয় সফল হয়েছে!"
          description={`রশিদ নং: #${completedSale.invoiceNo}`}
          maxWidth="sm"
        >
          <div className="space-y-4 text-center">
            <div className="inline-flex p-3 rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <span className="text-2xl font-black block font-mono">
                {shop.currencySymbol}{completedSale.grandTotal.toFixed(2)}
              </span>
              {completedSale.changeAmount > 0 && (
                <span className="text-xs text-emerald-600 font-bold block mt-1">
                  ফেরত দিতে হবে: {shop.currencySymbol}{completedSale.changeAmount.toFixed(2)}
                </span>
              )}
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer size={15} /> প্রিন্ট রসিদ ({shop.thermalWidth})
              </button>
              <button
                type="button"
                onClick={onCloseCompletedSale}
                className="w-full py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold text-xs rounded-xl hover:bg-neutral-200 cursor-pointer"
              >
                পরবর্তী কাস্টমার (Next)
              </button>
            </div>
          </div>
        </Modal>
      )}

      <PosReceiptThermalPrint sale={completedSale} shop={shop} />
    </>
  );
}