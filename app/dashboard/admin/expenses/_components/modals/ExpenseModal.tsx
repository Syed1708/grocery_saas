"use client";
import { useState } from "react";
import FormModal from "@/components/common/FormModal";
import { FormField } from "@/components/common/ui/form/FormField";
import { IExpense, IExpenseCategory } from "@/types";

export default function ExpenseModal({ isOpen, onClose, onSubmit, loading, expense, categories, currencySymbol, errors = {} }: { isOpen: boolean; onClose: () => void; onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void; loading: boolean; expense?: IExpense | null; categories: IExpenseCategory[]; currencySymbol: string; errors?: Record<string, string> }) {
  const isEditing = Boolean(expense);
  const catOptions = categories.map((c) => ({ label: `${c.name} (${c.code})`, value: c.id }));
  const [defaultVoucherNo] = useState(() => `EXP-${Date.now().toString().slice(-6)}`);

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={onSubmit} title={isEditing ? "Edit Expense" : "Record Daily Expense"} description="Deducts directly from cash drawer and logs transaction." loading={loading} isEditing={isEditing} maxWidth="lg">
      {expense && <input type="hidden" name="id" value={expense.id} />}
      <div className="grid grid-cols-2 gap-3">
        <FormField type="select" label="Expense Category" name="categoryId" required defaultValue={expense ? categories.find(c => c.name === expense.categoryName)?.id : ""} options={catOptions} placeholder="Select category" error={errors.categoryId} />
        <FormField type="text" label="Voucher #" name="voucherNo" required defaultValue={expense?.voucherNo || defaultVoucherNo} error={errors.voucherNo} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <FormField type="date" label="Date" name="expenseDate" required defaultValue={expense?.expenseDate ? new Date(expense.expenseDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]} error={errors.expenseDate} />
        <FormField type="number" label={`Amount (${currencySymbol})`} name="amount" step="0.01" required defaultValue={expense?.amount ?? ""} placeholder="0.00" error={errors.amount} />
        <FormField type="select" label="Payment Source" name="paymentMethod" defaultValue={expense?.paymentMethod || "cash"} options={[{ label: "Cash Drawer", value: "cash" }, { label: "Bank Account", value: "bank" }, { label: "bKash", value: "bkash" }]} error={errors.paymentMethod} />
      </div>
      <FormField type="text" label="Reference / Memo Note" name="reference" defaultValue={expense?.reference || ""} placeholder="e.g. Store rent for October" error={errors.reference} />
      <FormField type="textarea" label="Notes" name="note" rows={2} defaultValue={expense?.note || ""} error={errors.note} />
    </FormModal>
  );
}
