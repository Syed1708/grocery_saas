// app/dashboard/admin/purchases/_components/tabs/SupplierDuesTab.tsx
"use client";

import { useMemo } from "react";
import { History } from "lucide-react";

interface SupplierDuesTabProps {
  suppliers: any[];
  currencySymbol: string;
  onPay: (s: any) => void;
  onHistory: (s: any) => void;
}

export default function SupplierDuesTab({
  suppliers,
  currencySymbol,
  onPay,
  onHistory,
}: SupplierDuesTabProps) {
  const totalPayableDue = useMemo(() => {
    return suppliers.reduce(
      (sum, s) => sum + (Number(s.currentDue ?? s.payableBalance) || 0),
      0
    );
  }, [suppliers]);

  const dueSuppliers = useMemo(() => {
    return suppliers
      .filter((s) => (Number(s.currentDue ?? s.payableBalance) || 0) > 0)
      .sort(
        (a, b) =>
          Number(b.currentDue ?? b.payableBalance) - Number(a.currentDue ?? a.payableBalance)
      );
  }, [suppliers]);

  return (
    <div className="space-y-4">
      <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs flex justify-between items-center">
        <div>
          <span className="text-xs text-neutral-500">Total Store Liabilities (Unpaid Dues)</span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {currencySymbol}{totalPayableDue.toFixed(2)}
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold">
          {dueSuppliers.length} Creditor Vendors
        </span>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800">
        {dueSuppliers.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-400">
            🎉 No outstanding vendor debts. All cleared!
          </div>
        ) : (
          dueSuppliers.map((s) => {
            const debt = Number(s.currentDue ?? s.payableBalance ?? 0);
            return (
              <div
                key={s.id}
                className="p-4 flex items-center justify-between text-xs hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition"
              >
                <div>
                  <strong className="text-neutral-900 dark:text-neutral-100 text-sm block">
                    {s.companyName}
                  </strong>
                  <span className="text-[11px] text-neutral-400">
                    SR: {s.name} • {s.phone}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                    {currencySymbol}{debt.toFixed(2)}
                  </span>
                  <button
                    onClick={() => onHistory(s)}
                    className="p-2 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-100 text-neutral-600 dark:text-neutral-300 cursor-pointer"
                    title="Payment History Ledger"
                  >
                    <History size={14} />
                  </button>
                  <button
                    onClick={() => onPay(s)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition cursor-pointer shadow-xs"
                  >
                    Make Payment
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}