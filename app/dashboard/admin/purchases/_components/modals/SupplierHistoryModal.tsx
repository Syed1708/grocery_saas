// app/dashboard/admin/purchases/_components/modals/SupplierHistoryModal.tsx
"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/common/Modal";
import { Printer, Loader2 } from "lucide-react";
import { getSupplierPaymentHistoryAction } from "@/app/actions/supplier-actions";
import { toast } from "sonner";

interface SupplierHistoryModalProps {
  supplier: any | null;
  isOpen: boolean;
  onClose: () => void;
  onPrintVoucher: (payment: any) => void;
  currencySymbol?: string;
}

export default function SupplierHistoryModal({
  supplier,
  isOpen,
  onClose,
  onPrintVoucher,
  currencySymbol = "৳",
}: SupplierHistoryModalProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (supplier && isOpen) {
      setLoading(true);
      getSupplierPaymentHistoryAction(supplier.id)
        .then((res) => {
          if (res.success && res.data) setHistory(res.data);
          else toast.error("Failed to load history.");
        })
        .finally(() => setLoading(false));
    }
  }, [supplier, isOpen]);

  if (!supplier) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Supplier Payment Ledger: ${supplier.companyName}`}
      description="Timeline of past payouts disbursed to this vendor."
      maxWidth="xl"
    >
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin text-blue-600" />
            Loading ledger records...
          </div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-400">
            No payment vouchers recorded for this supplier yet.
          </div>
        ) : (
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">Voucher #</th>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Method</th>
                  <th className="p-2.5">Ref / Note</th>
                  <th className="p-2.5 text-right">Amount</th>
                  <th className="p-2.5 text-center">Print</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {history.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                    <td className="p-2.5 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                      #{p.voucherNo}
                    </td>
                    <td className="p-2.5 text-neutral-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="p-2.5 uppercase text-[10px] font-bold text-blue-600">{p.paymentMethod}</td>
                    <td className="p-2.5 text-neutral-400 truncate max-w-[140px]">
                      {p.reference ? `Ref: ${p.reference} ` : ""}{p.note || "—"}
                    </td>
                    <td className="p-2.5 text-right font-bold text-emerald-600">
                      {currencySymbol}{p.amount.toFixed(2)}
                    </td>
                    <td className="p-2.5 text-center">
                      <button
                        onClick={() => onPrintVoucher(p)}
                        className="p-1 rounded text-neutral-400 hover:text-purple-600 cursor-pointer"
                        title="Re-print Voucher"
                      >
                        <Printer size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}