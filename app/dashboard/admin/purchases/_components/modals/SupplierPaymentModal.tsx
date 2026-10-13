// app/dashboard/admin/purchases/_components/modals/SupplierPaymentModal.tsx
"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/common/Modal";
import { recordSupplierPaymentAction } from "@/app/actions/supplier-actions";
import { toast } from "sonner";

interface SupplierPaymentModalProps {
  supplier: any | null;
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
}: SupplierPaymentModalProps) {
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState("cash");
  const [payReference, setPayReference] = useState("");
  const [payNote, setPayNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (supplier) {
      const debt = Number(supplier.currentDue ?? supplier.payableBalance ?? 0);
      setPayAmount(debt);
      setPayMethod("cash");
      setPayReference("");
      setPayNote("");
    }
  }, [supplier]);

  if (!supplier) return null;

  const currentDebt = Number(supplier.currentDue ?? supplier.payableBalance ?? 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await recordSupplierPaymentAction({
      supplierId: supplier.id,
      amount: Number(payAmount),
      paymentMethod: payMethod,
      reference: payReference,
      note: payNote,
    });

    setLoading(false);

    if (res.success) {
      toast.success(`Payment of ${currencySymbol}${payAmount} recorded!`);
      onSuccess(res);
      onClose();
    } else {
      toast.error(res.error || "Failed to record payment.");
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Supplier Payment (মহাজন পাওনা পরিশোধ)"
      description={`Disburse payment to ${supplier.companyName}.`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 flex justify-between items-center text-xs">
          <span className="text-neutral-500">Current Owed Debt:</span>
          <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">
            {currencySymbol}{currentDebt.toFixed(2)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">Payment Amount ({currencySymbol}) *</label>
            <input
              type="number"
              step="0.01"
              required
              value={payAmount}
              onChange={(e) => setPayAmount(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold dark:bg-neutral-800 dark:border-neutral-700"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Disbursement Method *</label>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
              className="w-full px-3 py-2 text-xs border rounded-xl outline-none dark:bg-neutral-800 dark:border-neutral-700 cursor-pointer"
            >
              <option value="cash">Cash (ক্যাশ ড্রয়ার)</option>
              <option value="bank">Bank Transfer (ব্যাংক ট্রান্সফার)</option>
              <option value="bkash">bKash (বিকাশ)</option>
              <option value="nagad">Nagad (নগদ)</option>
              <option value="cheque">Bank Cheque (চেক)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Cheque # / Bank Ref / Slip No</label>
          <input
            type="text"
            value={payReference}
            onChange={(e) => setPayReference(e.target.value)}
            placeholder="e.g. CHQ-90182 or TrxID..."
            className="w-full px-3 py-2 text-xs border rounded-xl outline-none dark:bg-neutral-800 dark:border-neutral-700"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Notes / Description</label>
          <input
            type="text"
            value={payNote}
            onChange={(e) => setPayNote(e.target.value)}
            placeholder="e.g. Paid weekly dues against Chalan..."
            className="w-full px-3 py-2 text-xs border rounded-xl outline-none dark:bg-neutral-800 dark:border-neutral-700"
          />
        </div>

        <div className="p-2.5 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl flex justify-between text-xs font-semibold">
          <span>Remaining Due Balance:</span>
          <span className="text-amber-600 dark:text-amber-400">
            {currencySymbol}{Math.max(0, currentDebt - payAmount).toFixed(2)}
          </span>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || payAmount <= 0}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Recording..." : "Disburse & Print Voucher"}
          </button>
        </div>
      </form>
    </Modal>
  );
}