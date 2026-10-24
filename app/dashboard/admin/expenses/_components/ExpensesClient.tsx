"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ExpensesTab from "./tabs/ExpensesTab";
import IncomesTab from "./tabs/IncomesTab";
import AssetsTab from "./tabs/AssetsTab";
import EquityTab from "./tabs/EquityTab";
import ExpenseCategoriesTab from "./tabs/ExpenseCategoriesTab";

import ExpenseCategoryModal from "./modals/ExpenseCategoryModal";
import ExpenseModal from "./modals/ExpenseModal";
import IncomeModal from "./modals/IncomeModal";
import AssetModal from "./modals/AssetModal";
import EquityModal from "./modals/EquityModal";

import {
  createExpenseCategoryAction,
  deleteExpenseCategoryAction,
  createOrUpdateExpenseAction,
  deleteExpenseAction,
  createOrUpdateOtherIncomeAction,
  deleteOtherIncomeAction,
  createOrUpdateCompanyAssetAction,
  deleteCompanyAssetAction,
  createOrUpdateOwnerTransactionAction,
  deleteOwnerTransactionAction,
} from "@/app/actions/finance-actions";
import {
  IExpenseCategory,
  IExpense,
  IOtherIncome,
  ICompanyAsset,
  IOwnerTransaction,
} from "@/types";

export default function ExpensesClient({
  categories,
  expenses,
  incomes,
  assets,
  equity,
  currencySymbol = "৳",
}: {
  categories: IExpenseCategory[];
  expenses: IExpense[];
  incomes: IOtherIncome[];
  assets: ICompanyAsset[];
  equity: IOwnerTransaction[];
  currencySymbol?: string;
}) {
  const [activeTab, setActiveTab] = useState<"expenses" | "incomes" | "assets" | "equity" | "categories">("categories");

  // Modals state
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [equityModalOpen, setEquityModalOpen] = useState(false);
  const [catModalOpen, setCatModalOpen] = useState(false);

  // Edit targets
  const [editingExpense, setEditingExpense] = useState<IExpense | null>(null);
  const [editingIncome, setEditingIncome] = useState<IOtherIncome | null>(null);
  const [editingAsset, setEditingAsset] = useState<ICompanyAsset | null>(null);
  const [editingEquity, setEditingEquity] = useState<IOwnerTransaction | null>(null);
  const [editingCat, setEditingCat] = useState<IExpenseCategory | null>(null);

  // Delete targets
  const [deleteExpenseTarget, setDeleteExpenseTarget] = useState<IExpense | null>(null);
  const [deleteIncomeTarget, setDeleteIncomeTarget] = useState<IOtherIncome | null>(null);
  const [deleteAssetTarget, setDeleteAssetTarget] = useState<ICompanyAsset | null>(null);
  const [deleteEquityTarget, setDeleteEquityTarget] = useState<IOwnerTransaction | null>(null);
  const [deleteCatTarget, setDeleteCatTarget] = useState<IExpenseCategory | null>(null);

  const [loading, setLoading] = useState(false);

  // Summary
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalIncomes = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalAssets = assets.reduce((sum, a) => sum + a.currentValue, 0);
  const totalCapital = equity.filter(e => e.type === "CAPITAL").reduce((sum, e) => sum + e.amount, 0);
  const totalDrawings = equity.filter(e => e.type === "DRAWING").reduce((sum, e) => sum + e.amount, 0);

  // Generic Submit Wrapper
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>, action: (fd: FormData) => Promise<any>, successMsg: string, setter: (b: boolean) => void) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await action(formData);
    setLoading(false);
    if (res.success) {
      toast.success(successMsg);
      setter(false);
    } else {
      toast.error(res.error || "Operation failed.");
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Expenses & Financial Equity" }]} />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">Total Expenses</span>
          <span className="text-2xl font-black text-red-600 font-mono">{currencySymbol}{totalExpenses.toFixed(2)}</span>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">Other Incomes</span>
          <span className="text-2xl font-black text-emerald-600 font-mono">{currencySymbol}{totalIncomes.toFixed(2)}</span>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">Company Assets Valuation</span>
          <span className="text-2xl font-black text-blue-600 font-mono">{currencySymbol}{totalAssets.toFixed(2)}</span>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">Net Owner Equity</span>
          <span className="text-2xl font-black text-purple-600 font-mono">{currencySymbol}{(totalCapital - totalDrawings).toFixed(2)}</span>
        </div>
      </div>

      {/* TABS HEADER */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button onClick={() => setActiveTab("categories")} className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === "categories" ? "bg-blue-600 text-white shadow-xs" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600"}`}>
            🏷️ Expense Types ({categories.length})
          </button>

          <button onClick={() => setActiveTab("expenses")} className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === "expenses" ? "bg-blue-600 text-white shadow-xs" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600"}`}>
            📉 Daily Expenses ({expenses.length})
          </button>
          <button onClick={() => setActiveTab("incomes")} className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === "incomes" ? "bg-blue-600 text-white shadow-xs" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600"}`}>
            📈 Other Incomes ({incomes.length})
          </button>
          <button onClick={() => setActiveTab("assets")} className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === "assets" ? "bg-blue-600 text-white shadow-xs" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600"}`}>
            🏢 Company Assets ({assets.length})
          </button>
          <button onClick={() => setActiveTab("equity")} className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === "equity" ? "bg-blue-600 text-white shadow-xs" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600"}`}>
            💼 Capital &amp; Drawings
          </button>

        </div>

        <div className="flex items-center gap-2 shrink-0">
          {activeTab === "expenses" && (
            <button onClick={() => { setEditingExpense(null); setExpenseModalOpen(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer">
              <Plus size={15} /> Record Expense
            </button>
          )}
          {activeTab === "incomes" && (
            <button onClick={() => { setEditingIncome(null); setIncomeModalOpen(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer">
              <Plus size={15} /> Record Income
            </button>
          )}
          {activeTab === "assets" && (
            <button onClick={() => { setEditingAsset(null); setAssetModalOpen(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer">
              <Plus size={15} /> Add Asset
            </button>
          )}
          {activeTab === "equity" && (
            <button onClick={() => { setEditingEquity(null); setEquityModalOpen(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer">
              <Plus size={15} /> Capital / Drawing
            </button>
          )}
          {activeTab === "categories" && (
            <button onClick={() => { setEditingCat(null); setCatModalOpen(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer">
              <Plus size={15} /> Add Expense Category
            </button>
          )}
        </div>
      </div>

      {/* RENDER TABS */}
      {activeTab === "categories" && <ExpenseCategoriesTab categories={categories} onEdit={(c) => { setEditingCat(c); setCatModalOpen(true); }} onDelete={setDeleteCatTarget} />}
      {activeTab === "expenses" && <ExpensesTab expenses={expenses} currencySymbol={currencySymbol} onEdit={(e) => { setEditingExpense(e); setExpenseModalOpen(true); }} onDelete={setDeleteExpenseTarget} />}
      {activeTab === "incomes" && <IncomesTab incomes={incomes} currencySymbol={currencySymbol} onEdit={(i) => { setEditingIncome(i); setIncomeModalOpen(true); }} onDelete={setDeleteIncomeTarget} />}
      {activeTab === "assets" && <AssetsTab assets={assets} currencySymbol={currencySymbol} onEdit={(a) => { setEditingAsset(a); setAssetModalOpen(true); }} onDelete={setDeleteAssetTarget} />}
      {activeTab === "equity" && <EquityTab equity={equity} currencySymbol={currencySymbol} onEdit={(eq) => { setEditingEquity(eq); setEquityModalOpen(true); }} onDelete={setDeleteEquityTarget} />}
      

      {/* MODALS */}
      <ExpenseCategoryModal isOpen={catModalOpen} onClose={() => { setCatModalOpen(false); setEditingCat(null); }} onSubmit={(e) => handleSubmit(e, createExpenseCategoryAction, "Expense type saved!", setCatModalOpen)} loading={loading} category={editingCat} />
      <ExpenseModal isOpen={expenseModalOpen} onClose={() => { setExpenseModalOpen(false); setEditingExpense(null); }} onSubmit={(e) => handleSubmit(e, createOrUpdateExpenseAction, "Expense saved!", setExpenseModalOpen)} loading={loading} expense={editingExpense} categories={categories} currencySymbol={currencySymbol} />
      <IncomeModal isOpen={incomeModalOpen} onClose={() => { setIncomeModalOpen(false); setEditingIncome(null); }} onSubmit={(e) => handleSubmit(e, createOrUpdateOtherIncomeAction, "Income saved!", setIncomeModalOpen)} loading={loading} income={editingIncome} currencySymbol={currencySymbol} />
      <AssetModal isOpen={assetModalOpen} onClose={() => { setAssetModalOpen(false); setEditingAsset(null); }} onSubmit={(e) => handleSubmit(e, createOrUpdateCompanyAssetAction, "Asset saved!", setAssetModalOpen)} loading={loading} asset={editingAsset} currencySymbol={currencySymbol} />
      <EquityModal isOpen={equityModalOpen} onClose={() => { setEquityModalOpen(false); setEditingEquity(null); }} onSubmit={(e) => handleSubmit(e, createOrUpdateOwnerTransactionAction, "Transaction saved!", setEquityModalOpen)} loading={loading} equity={editingEquity} currencySymbol={currencySymbol} />

      {/* CONFIRMATION DIALOGS */}
      <ConfirmDialog isOpen={Boolean(deleteExpenseTarget)} onClose={() => setDeleteExpenseTarget(null)} onConfirm={async () => { setLoading(true); await deleteExpenseAction(deleteExpenseTarget!.id); setLoading(false); setDeleteExpenseTarget(null); toast.success("Expense deleted."); }} title="Delete Expense" message="Are you sure you want to delete this expense record?" loading={loading} />
      <ConfirmDialog isOpen={Boolean(deleteIncomeTarget)} onClose={() => setDeleteIncomeTarget(null)} onConfirm={async () => { setLoading(true); await deleteOtherIncomeAction(deleteIncomeTarget!.id); setLoading(false); setDeleteIncomeTarget(null); toast.success("Income deleted."); }} title="Delete Income" message="Are you sure you want to delete this income record?" loading={loading} />
      <ConfirmDialog isOpen={Boolean(deleteAssetTarget)} onClose={() => setDeleteAssetTarget(null)} onConfirm={async () => { setLoading(true); await deleteCompanyAssetAction(deleteAssetTarget!.id); setLoading(false); setDeleteAssetTarget(null); toast.success("Asset deleted."); }} title="Delete Asset" message="Are you sure you want to delete this company asset?" loading={loading} />
      <ConfirmDialog isOpen={Boolean(deleteEquityTarget)} onClose={() => setDeleteEquityTarget(null)} onConfirm={async () => { setLoading(true); await deleteOwnerTransactionAction(deleteEquityTarget!.id); setLoading(false); setDeleteEquityTarget(null); toast.success("Transaction deleted."); }} title="Delete Transaction" message="Are you sure you want to delete this owner transaction?" loading={loading} />
      <ConfirmDialog isOpen={Boolean(deleteCatTarget)} onClose={() => setDeleteCatTarget(null)} onConfirm={async () => { setLoading(true); const res = await deleteExpenseCategoryAction(deleteCatTarget!.id); setLoading(false); setDeleteCatTarget(null); if(res.success) toast.success("Category deleted."); else toast.error(res.error); }} title="Delete Expense Type" message={`Delete expense category "${deleteCatTarget?.name}"?`} loading={loading} />
    </div>
  );
}