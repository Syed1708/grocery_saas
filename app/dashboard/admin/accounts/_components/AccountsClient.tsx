"use client";

import { useState } from "react";
import { Plus, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { StatCard } from "@/components/common/StatCard";
import { useCrudModal } from "@/hooks/useCrudModal";
import AccountsTab from "./AccountsTab";
import ChequesTab from "./ChequesTab";
import LoansTab from "./LoansTab";
import AccountModal from "./modals/AccountModal";
import TransferModal from "./modals/TransferModal";
import ChequeModal from "./modals/ChequeModal";
import ClearChequeModal from "./modals/ClearChequeModal";
import LoanModal from "./modals/LoanModal";
import InstallmentModal from "./modals/InstallmentModal";
import {
  createAccountAction,
  updateAccountAction,
  deleteAccountAction,
  transferFundsAction,
  createChequeAction,
  clearChequeAction,
  deleteChequeAction,
  updateChequeAction,
} from "@/app/actions/account-actions";
import { createLoanAction, addLoanInstallmentAction, deleteLoanAction, updateLoanAction } from "@/app/actions/loan-actions";
import { IAccount, IBankCheque, ILoan } from "@/types";

export default function AccountsClient({
  accounts,
  cheques,
  loans,
  currencySymbol = "৳",
}: {
  accounts: IAccount[];
  cheques: IBankCheque[];
  loans: ILoan[];
  currencySymbol?: string;
}) {
  const [activeTab, setActiveTab] = useState<"accounts" | "cheques" | "loans">("accounts");

  // Universal CRUD engines
  const accountCrud = useCrudModal<IAccount>({
    createAction: createAccountAction,
    updateAction: updateAccountAction,
    deleteAction: deleteAccountAction,
    entityName: "অ্যাকাউন্ট",
  });

  const chequeCrud = useCrudModal<IBankCheque>({
    createAction: createChequeAction,
    updateAction: updateChequeAction,
    deleteAction: deleteChequeAction,
    entityName: "চেক",
  });

  const loanCrud = useCrudModal<ILoan>({
    createAction: createLoanAction,
    updateAction: updateLoanAction,
    deleteAction: deleteLoanAction,
    entityName: "ঋণ",
  });

  // One-off action modals (transfer / clear cheque / installment)
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [clearingCheque, setClearingCheque] = useState<IBankCheque | null>(null);
  const [clearLoading, setClearLoading] = useState(false);
  const [installmentsLoan, setInstallmentsLoan] = useState<ILoan | null>(null);
  const [installmentLoading, setInstallmentLoading] = useState(false);

  const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);
  const cashBalance = accounts.filter((a) => a.type === "CASH").reduce((sum, a) => sum + a.currentBalance, 0);
  const bankBalance = accounts.filter((a) => a.type === "BANK").reduce((sum, a) => sum + a.currentBalance, 0);
  const mfsBalance = accounts.filter((a) => ["BKASH", "NAGAD", "ROCKET"].includes(a.type)).reduce((sum, a) => sum + a.currentBalance, 0);

  async function handleTransferSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setTransferLoading(true);
    const res = await transferFundsAction(new FormData(e.currentTarget));
    setTransferLoading(false);
    if (res.success) {
      toast.success("Funds transferred successfully!");
      setTransferModalOpen(false);
    } else {
      toast.error(res.error || "Transfer failed.");
    }
  }

  async function handleClearChequeSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!clearingCheque) return;
    setClearLoading(true);
    const formData = new FormData(e.currentTarget);
    const accountId = formData.get("accountId")?.toString();
    const res = await clearChequeAction(clearingCheque.id, accountId || "");
    setClearLoading(false);
    if (res.success) {
      toast.success("Cheque cleared & account ledger updated!");
      setClearingCheque(null);
    } else {
      toast.error(res.error || "Failed to clear cheque.");
    }
  }

  async function handleInstallmentSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!installmentsLoan) return;
    setInstallmentLoading(true);
    const res = await addLoanInstallmentAction(new FormData(e.currentTarget));
    setInstallmentLoading(false);
    if (res.success) {
      toast.success("Installment recorded & account balance adjusted!");
      setInstallmentsLoan(null);
    } else {
      toast.error(res.error || "Failed to record installment.");
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Banking & Accounts" }]} />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Liquid Balance" value={`${currencySymbol}${totalBalance.toFixed(2)}`} tone="neutral" />
        <StatCard title="Cash Drawer" value={`${currencySymbol}${cashBalance.toFixed(2)}`} tone="emerald" />
        <StatCard title="Bank Accounts" value={`${currencySymbol}${bankBalance.toFixed(2)}`} tone="blue" />
        <StatCard title="Mobile Wallets (MFS)" value={`${currencySymbol}${mfsBalance.toFixed(2)}`} tone="fuchsia" />
      </div>

      {/* TABS HEADER */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("accounts")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === "accounts" ? "bg-blue-600 text-white shadow-xs" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600"
              }`}
          >
            🏦 Accounts ({accounts.length})
          </button>
          <button
            onClick={() => setActiveTab("cheques")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === "cheques" ? "bg-blue-600 text-white shadow-xs" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600"
              }`}
          >
            📜 Cheques ({cheques.length})
          </button>
          <button
            onClick={() => setActiveTab("loans")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === "loans" ? "bg-blue-600 text-white shadow-xs" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600"
              }`}
          >
            🤝 Loans &amp; Hawlat ({loans.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTransferModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold rounded-xl hover:bg-neutral-50 transition cursor-pointer"
          >
            <ArrowRightLeft size={14} /> Fund Transfer
          </button>
          {activeTab === "accounts" && (
            <button
              onClick={accountCrud.openCreate}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus size={15} /> Add Account
            </button>
          )}
          {activeTab === "cheques" && (
            <button
              onClick={chequeCrud.openCreate}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus size={15} /> Log Cheque
            </button>
          )}
          {activeTab === "loans" && (
            <button
              onClick={loanCrud.openCreate}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus size={15} /> Record Loan
            </button>
          )}
        </div>
      </div>

      {/* RENDER ACTIVE TAB */}
      {activeTab === "accounts" && (
        <AccountsTab
          accounts={accounts}
          currencySymbol={currencySymbol}
          onEdit={accountCrud.openEdit}
          onDelete={accountCrud.setDeleteTarget}
        />
      )}
      {activeTab === "cheques" && (
        <ChequesTab
          cheques={cheques}
          currencySymbol={currencySymbol}
          onClearCheque={setClearingCheque}
          onEditCheque={chequeCrud.openEdit}
          onDeleteCheque={chequeCrud.setDeleteTarget}
        />
      )}
      {activeTab === "loans" && (
        <LoansTab
          loans={loans}
          currencySymbol={currencySymbol}
          onPayInstallment={setInstallmentsLoan}
          onEditLoan={loanCrud.openEdit}
          onDeleteLoan={loanCrud.setDeleteTarget}
        />
      )}

      {/* MODALS */}
      <AccountModal
        key={accountCrud.editingItem?.id || `account-${accountCrud.isOpen}`}
        isOpen={accountCrud.isOpen}
        onClose={accountCrud.closeModal}
        onSubmit={accountCrud.handleSubmit}
        loading={accountCrud.loading}
        account={accountCrud.editingItem}
        currencySymbol={currencySymbol}
        errors={accountCrud.errors}
      />
      <TransferModal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        onSubmit={handleTransferSubmit}
        loading={transferLoading}
        accounts={accounts}
        currencySymbol={currencySymbol}
      />
      <ChequeModal
        key={chequeCrud.editingItem?.id || `cheque-${chequeCrud.isOpen}`}
        isOpen={chequeCrud.isOpen}
        onClose={chequeCrud.closeModal}
        onSubmit={chequeCrud.handleSubmit}
        loading={chequeCrud.loading}
        cheque={chequeCrud.editingItem}
        currencySymbol={currencySymbol}
        errors={chequeCrud.errors}
      />
      <ClearChequeModal
        cheque={clearingCheque}
        onClose={() => setClearingCheque(null)}
        onSubmit={handleClearChequeSubmit}
        loading={clearLoading}
        accounts={accounts}
        currencySymbol={currencySymbol}
      />
      <LoanModal
        key={loanCrud.editingItem?.id || `loan-${loanCrud.isOpen}`}
        isOpen={loanCrud.isOpen}
        onClose={loanCrud.closeModal}
        onSubmit={loanCrud.handleSubmit}
        loading={loanCrud.loading}
        loan={loanCrud.editingItem}
        accounts={accounts}
        currencySymbol={currencySymbol}
        errors={loanCrud.errors}
      />
      <InstallmentModal
        loan={installmentsLoan}
        onClose={() => setInstallmentsLoan(null)}
        onSubmit={handleInstallmentSubmit}
        loading={installmentLoading}
        accounts={accounts}
        currencySymbol={currencySymbol}
      />

      {/* CONFIRMATION DIALOGS */}
      <ConfirmDialog
        isOpen={Boolean(accountCrud.deleteTarget)}
        onClose={() => accountCrud.setDeleteTarget(null)}
        onConfirm={accountCrud.handleDeleteConfirm}
        title="Delete Account"
        message={`Are you sure you want to delete "${accountCrud.deleteTarget?.name}"?`}
        loading={accountCrud.loading}
      />
      <ConfirmDialog
        isOpen={Boolean(chequeCrud.deleteTarget)}
        onClose={() => chequeCrud.setDeleteTarget(null)}
        onConfirm={chequeCrud.handleDeleteConfirm}
        title="Delete Cheque"
        message={`Delete cheque #${chequeCrud.deleteTarget?.chequeNumber}?`}
        loading={chequeCrud.loading}
      />
      <ConfirmDialog
        isOpen={Boolean(loanCrud.deleteTarget)}
        onClose={() => loanCrud.setDeleteTarget(null)}
        onConfirm={loanCrud.handleDeleteConfirm}
        title="Delete Loan"
        message={`Delete loan record for ${loanCrud.deleteTarget?.personName}?`}
        loading={loanCrud.loading}
      />
    </div>
  );
}
