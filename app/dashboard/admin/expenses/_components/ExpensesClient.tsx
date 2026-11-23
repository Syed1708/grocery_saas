"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { StatCard } from "@/components/common/StatCard";
import { useCrudModal } from "@/hooks/useCrudModal";
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

  // Universal CRUD engines
  const catCrud = useCrudModal<IExpenseCategory>({
    createAction: createExpenseCategoryAction,
    updateAction: createExpenseCategoryAction,
    deleteAction: deleteExpenseCategoryAction,
    entityName: "খরচের খাত",
  });

  const expenseCrud = useCrudModal<IExpense>({
    createAction: createOrUpdateExpenseAction,
    updateAction: createOrUpdateExpenseAction,
    deleteAction: deleteExpenseAction,
    entityName: "খরচ",
  });

  const incomeCrud = useCrudModal<IOtherIncome>({
    createAction: createOrUpdateOtherIncomeAction,
    updateAction: createOrUpdateOtherIncomeAction,
    deleteAction: deleteOtherIncomeAction,
    entityName: "আয়",
  });

  const assetCrud = useCrudModal<ICompanyAsset>({
    createAction: createOrUpdateCompanyAssetAction,
    updateAction: createOrUpdateCompanyAssetAction,
    deleteAction: deleteCompanyAssetAction,
    entityName: "সম্পদ",
  });

  const equityCrud = useCrudModal<IOwnerTransaction>({
    createAction: createOrUpdateOwnerTransactionAction,
    updateAction: createOrUpdateOwnerTransactionAction,
    deleteAction: deleteOwnerTransactionAction,
    entityName: "মূলধন",
  });

  // Summary
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalIncomes = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalAssets = assets.reduce((sum, a) => sum + a.currentValue, 0);
  const totalCapital = equity.filter(e => e.type === "CAPITAL").reduce((sum, e) => sum + e.amount, 0);
  const totalDrawings = equity.filter(e => e.type === "DRAWING").reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Expenses & Financial Equity" }]} />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Expenses" value={`${currencySymbol}${totalExpenses.toFixed(2)}`} tone="rose" />
        <StatCard title="Other Incomes" value={`${currencySymbol}${totalIncomes.toFixed(2)}`} tone="emerald" />
        <StatCard title="Company Assets Valuation" value={`${currencySymbol}${totalAssets.toFixed(2)}`} tone="blue" />
        <StatCard title="Net Owner Equity" value={`${currencySymbol}${(totalCapital - totalDrawings).toFixed(2)}`} tone="violet" />
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
            <button onClick={expenseCrud.openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer">
              <Plus size={15} /> Record Expense
            </button>
          )}
          {activeTab === "incomes" && (
            <button onClick={incomeCrud.openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer">
              <Plus size={15} /> Record Income
            </button>
          )}
          {activeTab === "assets" && (
            <button onClick={assetCrud.openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer">
              <Plus size={15} /> Add Asset
            </button>
          )}
          {activeTab === "equity" && (
            <button onClick={equityCrud.openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer">
              <Plus size={15} /> Capital / Drawing
            </button>
          )}
          {activeTab === "categories" && (
            <button onClick={catCrud.openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer">
              <Plus size={15} /> Add Expense Category
            </button>
          )}
        </div>
      </div>

      {/* RENDER TABS */}
      {activeTab === "categories" && <ExpenseCategoriesTab categories={categories} onEdit={catCrud.openEdit} onDelete={catCrud.setDeleteTarget} />}
      {activeTab === "expenses" && <ExpensesTab expenses={expenses} currencySymbol={currencySymbol} onEdit={expenseCrud.openEdit} onDelete={expenseCrud.setDeleteTarget} />}
      {activeTab === "incomes" && <IncomesTab incomes={incomes} currencySymbol={currencySymbol} onEdit={incomeCrud.openEdit} onDelete={incomeCrud.setDeleteTarget} />}
      {activeTab === "assets" && <AssetsTab assets={assets} currencySymbol={currencySymbol} onEdit={assetCrud.openEdit} onDelete={assetCrud.setDeleteTarget} />}
      {activeTab === "equity" && <EquityTab equity={equity} currencySymbol={currencySymbol} onEdit={equityCrud.openEdit} onDelete={equityCrud.setDeleteTarget} />}

      {/* MODALS */}
      <ExpenseCategoryModal
        key={catCrud.editingItem?.id || `cat-${catCrud.isOpen}`}
        isOpen={catCrud.isOpen}
        onClose={catCrud.closeModal}
        onSubmit={catCrud.handleSubmit}
        loading={catCrud.loading}
        category={catCrud.editingItem}
        errors={catCrud.errors}
      />
      <ExpenseModal
        key={expenseCrud.editingItem?.id || `expense-${expenseCrud.isOpen}`}
        isOpen={expenseCrud.isOpen}
        onClose={expenseCrud.closeModal}
        onSubmit={expenseCrud.handleSubmit}
        loading={expenseCrud.loading}
        expense={expenseCrud.editingItem}
        categories={categories}
        currencySymbol={currencySymbol}
        errors={expenseCrud.errors}
      />
      <IncomeModal
        key={incomeCrud.editingItem?.id || `income-${incomeCrud.isOpen}`}
        isOpen={incomeCrud.isOpen}
        onClose={incomeCrud.closeModal}
        onSubmit={incomeCrud.handleSubmit}
        loading={incomeCrud.loading}
        income={incomeCrud.editingItem}
        currencySymbol={currencySymbol}
        errors={incomeCrud.errors}
      />
      <AssetModal
        key={assetCrud.editingItem?.id || `asset-${assetCrud.isOpen}`}
        isOpen={assetCrud.isOpen}
        onClose={assetCrud.closeModal}
        onSubmit={assetCrud.handleSubmit}
        loading={assetCrud.loading}
        asset={assetCrud.editingItem}
        currencySymbol={currencySymbol}
        errors={assetCrud.errors}
      />
      <EquityModal
        key={equityCrud.editingItem?.id || `equity-${equityCrud.isOpen}`}
        isOpen={equityCrud.isOpen}
        onClose={equityCrud.closeModal}
        onSubmit={equityCrud.handleSubmit}
        loading={equityCrud.loading}
        equity={equityCrud.editingItem}
        currencySymbol={currencySymbol}
        errors={equityCrud.errors}
      />

      {/* CONFIRMATION DIALOGS */}
      <ConfirmDialog
        isOpen={Boolean(expenseCrud.deleteTarget)}
        onClose={() => expenseCrud.setDeleteTarget(null)}
        onConfirm={expenseCrud.handleDeleteConfirm}
        title="Delete Expense"
        message="Are you sure you want to delete this expense record? The cash drawer will be refunded."
        loading={expenseCrud.loading}
      />
      <ConfirmDialog
        isOpen={Boolean(incomeCrud.deleteTarget)}
        onClose={() => incomeCrud.setDeleteTarget(null)}
        onConfirm={incomeCrud.handleDeleteConfirm}
        title="Delete Income"
        message="Are you sure you want to delete this income record? The cash drawer will be adjusted."
        loading={incomeCrud.loading}
      />
      <ConfirmDialog
        isOpen={Boolean(assetCrud.deleteTarget)}
        onClose={() => assetCrud.setDeleteTarget(null)}
        onConfirm={assetCrud.handleDeleteConfirm}
        title="Delete Asset"
        message="Are you sure you want to delete this company asset?"
        loading={assetCrud.loading}
      />
      <ConfirmDialog
        isOpen={Boolean(equityCrud.deleteTarget)}
        onClose={() => equityCrud.setDeleteTarget(null)}
        onConfirm={equityCrud.handleDeleteConfirm}
        title="Delete Transaction"
        message="Are you sure you want to delete this owner transaction?"
        loading={equityCrud.loading}
      />
      <ConfirmDialog
        isOpen={Boolean(catCrud.deleteTarget)}
        onClose={() => catCrud.setDeleteTarget(null)}
        onConfirm={catCrud.handleDeleteConfirm}
        title="Delete Expense Type"
        message={`Delete expense category "${catCrud.deleteTarget?.name}"?`}
        loading={catCrud.loading}
      />
    </div>
  );
}
