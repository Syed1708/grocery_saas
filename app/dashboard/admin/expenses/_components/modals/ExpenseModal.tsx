"use client";
import FormModal from "@/components/common/FormModal";
import { Input } from "@/components/common/ui/Input";
import { Select } from "@/components/common/ui/Select";
import { Textarea } from "@/components/common/ui/Textarea";
import { IExpense, IExpenseCategory } from "@/types";

export default function ExpenseModal({ isOpen, onClose, onSubmit, loading, expense, categories, currencySymbol }: { isOpen: boolean; onClose: () => void; onSubmit: (e: any) => void; loading: boolean; expense?: IExpense | null; categories: IExpenseCategory[]; currencySymbol: string }) {
  const isEditing = Boolean(expense);
  const catOptions = categories.map((c) => ({ label: `${c.name} (${c.code})`, value: c.id }));

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={onSubmit} title={isEditing ? "Edit Expense" : "Record Daily Expense"} description="Deducts directly from cash drawer and logs transaction." loading={loading} isEditing={isEditing} maxWidth="lg">
      {expense && <input type="hidden" name="id" value={expense.id} />}
      <div className="grid grid-cols-2 gap-3">
        <Select label="Expense Category *" name="categoryId" required defaultValue={expense ? categories.find(c => c.name === expense.categoryName)?.id : ""} options={catOptions} placeholder="Select category" />
        <Input label="Voucher # *" name="voucherNo" required defaultValue={expense?.voucherNo || `EXP-${Date.now().toString().slice(-6)}`} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Input label="Date *" name="expenseDate" type="date" required defaultValue={expense?.expenseDate ? new Date(expense.expenseDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]} />
        <Input label={`Amount (${currencySymbol}) *`} name="amount" type="number" step="0.01" required defaultValue={expense?.amount ?? ""} placeholder="0.00" />
        <Select label="Payment Source" name="paymentMethod" defaultValue={expense?.paymentMethod || "cash"} options={[{ label: "Cash Drawer", value: "cash" }, { label: "Bank Account", value: "bank" }, { label: "bKash", value: "bkash" }]} />
      </div>
      <Input label="Reference / Memo Note" name="reference" defaultValue={expense?.reference || ""} placeholder="e.g. Store rent for October" />
      <Textarea label="Notes" name="note" rows={2} defaultValue={expense?.note || ""} />
    </FormModal>
  );
}