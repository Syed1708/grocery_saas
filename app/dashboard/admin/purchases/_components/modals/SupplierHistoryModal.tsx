"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/common/Modal";
import { Printer, Loader2, Calendar } from "lucide-react";
import { getSupplierPaymentHistoryAction } from "@/app/actions/supplier-actions";
import { ISupplier } from "@/types";

interface Props {
  supplier: ISupplier | null;
  isOpen: boolean;
  onClose: () => void;
  onPrintVoucher: (p: any) => void;
  currencySymbol?: string;
}

export default function SupplierHistoryModal({
  supplier,
  isOpen,
  onClose,
  onPrintVoucher,
  currencySymbol = "৳",
}: Props) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (supplier?.id && isOpen) {
      setLoading(true);
      getSupplierPaymentHistoryAction(supplier.id).then((res) => {
        setLoading(false);
        if (res.success && res.data) setPayments(res.data);
      });
    }
  }, [supplier, isOpen]);

  if (!supplier) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${supplier.companyName || supplier.name} - পেমেন্ট হিস্ট্রি`}
      description="এই সরবরাহকারীকে বিগত দিনে প্রদানকৃত সকল ভাউচারের তালিকা।"
      maxWidth="md"
    >
      <div className="space-y-4 text-xs">
        {loading ? (
          <div className="py-8 text-center text-neutral-400 flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> হিস্ট্রি লোড হচ্ছে...
          </div>
        ) : payments.length === 0 ? (
          <div className="py-8 text-center text-neutral-400">
            এই সরবরাহকারীকে এখনো কোনো সরাসরি পেমেন্ট ভাউচার দেওয়া হয়নি।
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800 border rounded-xl">
            {payments.map((p) => (
              <div key={p.id} className="p-3 flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold block">#{p.voucherNo}</span>
                  <span className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
                    <Calendar size={11} /> {new Date(p.createdAt).toLocaleDateString()} • {p.paymentMethod.toUpperCase()}
                  </span>
                  {p.reference && <span className="text-[10px] text-neutral-500">Ref: {p.reference}</span>}
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-emerald-600 text-sm">
                    {currencySymbol}{p.amount.toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onPrintVoucher(p)}
                    className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 rounded-lg transition cursor-pointer"
                    title="রসিদ প্রিন্ট করুন"
                  >
                    <Printer size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-xl font-semibold hover:bg-neutral-50 cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </Modal>
  );
}