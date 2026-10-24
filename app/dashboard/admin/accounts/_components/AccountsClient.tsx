"use client";

import { useState } from "react";
import { Plus, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import AccountsTab from "./AccountsTab";
import ChequesTab from "./ChequesTab";
import LoansTab from "./LoansTab";
import AccountModal from "./modals/AccountModal";
import TransferModal from "./modals/TransferModal";
import ChequeModal from "./modals/ChequeModal";
import ClearChequeModal from "./modals/ClearChequeModal";
import LoanModal from "./modals/LoanModal";
import InstallmentModal from "./modals/InstallmentModal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
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

  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [chequeModalOpen, setChequeModalOpen] = useState(false);
  const [loanModalOpen, setLoanModalOpen] = useState(false);

  const [editingAccount, setEditingAccount] = useState<IAccount | null>(null);
  const [clearingCheque, setClearingCheque] = useState<IBankCheque | null>(null);
  const [installmentsLoan, setInstallmentsLoan] = useState<ILoan | null>(null);

  const [deleteAccountTarget, setDeleteAccountTarget] = useState<IAccount | null>(null);
  const [deleteChequeTarget, setDeleteChequeTarget] = useState<IBankCheque | null>(null);
  const [deleteLoanTarget, setDeleteLoanTarget] = useState<ILoan | null>(null);
  const [loading, setLoading] = useState(false);

  const [editingCheque, setEditingCheque] = useState<IBankCheque | null>(null);
  const [editingLoan, setEditingLoan] = useState<ILoan | null>(null);

  // Summary balances
  const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);
  const cashBalance = accounts.filter((a) => a.type === "CASH").reduce((sum, a) => sum + a.currentBalance, 0);
  const bankBalance = accounts.filter((a) => a.type === "BANK").reduce((sum, a) => sum + a.currentBalance, 0);
  const mfsBalance = accounts.filter((a) => ["BKASH", "NAGAD", "ROCKET"].includes(a.type)).reduce((sum, a) => sum + a.currentBalance, 0);

  async function handleAccountSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = editingAccount
      ? await updateAccountAction(formData)
      : await createAccountAction(formData);

    setLoading(false);
    if (res.success) {
      toast.success(editingAccount ? "Account updated successfully!" : "Account created successfully!");
      setAccountModalOpen(false);
      setEditingAccount(null);
    } else {
      toast.error(res.error || "Operation failed.");
    }
  }

  async function handleTransferSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await transferFundsAction(formData);
    setLoading(false);
    if (res.success) {
      toast.success("Funds transferred successfully!");
      setTransferModalOpen(false);
    } else {
      toast.error(res.error || "Transfer failed.");
    }
  }



  async function handleChequeSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = editingCheque ? await updateChequeAction(formData) : await createChequeAction(formData);
    setLoading(false);
    if (res.success) {
      toast.success(editingCheque ? "Cheque updated!" : "Cheque logged!");
      setChequeModalOpen(false);
      setEditingCheque(null);
    } else {
      toast.error(res.error || "Operation failed.");
    }
  }

  async function handleClearChequeSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!clearingCheque) return;
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const accountId = formData.get("accountId")?.toString();

    const res = await clearChequeAction(clearingCheque.id, accountId || "");
    setLoading(false);

    if (res.success) {
      toast.success("Cheque cleared & account ledger updated!");
      setClearingCheque(null);
    } else {
      toast.error(res.error || "Failed to clear cheque.");
    }
  }



  async function handleLoanSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = editingLoan ? await updateLoanAction(formData) : await createLoanAction(formData);
    setLoading(false);
    if (res.success) {
      toast.success(editingLoan ? "Loan updated!" : "Loan recorded!");
      setLoanModalOpen(false);
      setEditingLoan(null);
    } else {
      toast.error(res.error || "Operation failed.");
    }
  }

  async function handleInstallmentSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!installmentsLoan) return;
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await addLoanInstallmentAction(formData);
    setLoading(false);
    if (res.success) {
      toast.success("Installment recorded & account balance adjusted!");
      setInstallmentsLoan(null);
    } else {
      toast.error(res.error || "Failed to record installment.");
    }
  }

  async function handleDeleteAccount() {
    if (!deleteAccountTarget) return;
    setLoading(true);
    const res = await deleteAccountAction(deleteAccountTarget.id);
    setLoading(false);
    if (res.success) {
      toast.success("Account deleted.");
      setDeleteAccountTarget(null);
    } else {
      toast.error(res.error || "Failed to delete account.");
    }
  }

  async function handleDeleteCheque() {
    if (!deleteChequeTarget) return;
    setLoading(true);
    const res = await deleteChequeAction(deleteChequeTarget.id);
    setLoading(false);
    if (res.success) {
      toast.success("Cheque deleted.");
      setDeleteChequeTarget(null);
    } else {
      toast.error(res.error || "Failed to delete cheque.");
    }
  }

  async function handleDeleteLoan() {
    if (!deleteLoanTarget) return;
    setLoading(true);
    const res = await deleteLoanAction(deleteLoanTarget.id);
    setLoading(false);
    if (res.success) {
      toast.success("Loan record deleted.");
      setDeleteLoanTarget(null);
    } else {
      toast.error(res.error || "Failed to delete loan.");
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Banking & Accounts" }]} />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">Total Liquid Balance</span>
          <span className="text-2xl font-black text-neutral-900 dark:text-neutral-100 font-mono">
            {currencySymbol}{totalBalance.toFixed(2)}
          </span>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">Cash Drawer</span>
          <span className="text-2xl font-black text-emerald-600 font-mono">
            {currencySymbol}{cashBalance.toFixed(2)}
          </span>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">Bank Accounts</span>
          <span className="text-2xl font-black text-blue-600 font-mono">
            {currencySymbol}{bankBalance.toFixed(2)}
          </span>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">Mobile Wallets (MFS)</span>
          <span className="text-2xl font-black text-fuchsia-600 font-mono">
            {currencySymbol}{mfsBalance.toFixed(2)}
          </span>
        </div>
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
              onClick={() => { setEditingAccount(null); setAccountModalOpen(true); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus size={15} /> Add Account
            </button>
          )}
          {activeTab === "cheques" && (
            <button
              onClick={() => setChequeModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus size={15} /> Log Cheque
            </button>
          )}
          {activeTab === "loans" && (
            <button
              onClick={() => setLoanModalOpen(true)}
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
          onEdit={(a) => { setEditingAccount(a); setAccountModalOpen(true); }}
          onDelete={setDeleteAccountTarget}
        />
      )}
      {activeTab === "cheques" && (
        <ChequesTab

          cheques={cheques}
          currencySymbol={currencySymbol}
          onClearCheque={setClearingCheque}
          onEditCheque={(c) => { setEditingCheque(c); setChequeModalOpen(true); }}
          onDeleteCheque={setDeleteChequeTarget}
        />
      )}
      {activeTab === "loans" && (
        <LoansTab
          loans={loans}
          currencySymbol={currencySymbol}
          onPayInstallment={setInstallmentsLoan}
          onEditLoan={(l) => { setEditingLoan(l); setLoanModalOpen(true); }}
          onDeleteLoan={setDeleteLoanTarget}
        />
      )}

      {/* MODALS */}
      <AccountModal
        isOpen={accountModalOpen}
        onClose={() => { setAccountModalOpen(false); setEditingAccount(null); }}
        onSubmit={handleAccountSubmit}
        loading={loading}
        account={editingAccount}
        currencySymbol={currencySymbol}
      />
      <TransferModal isOpen={transferModalOpen} onClose={() => setTransferModalOpen(false)} onSubmit={handleTransferSubmit} loading={loading} accounts={accounts} currencySymbol={currencySymbol} />
      <ChequeModal
        isOpen={chequeModalOpen}
        onClose={() => { setChequeModalOpen(false); setEditingCheque(null); }}
        onSubmit={handleChequeSubmit}
        loading={loading}
        cheque={editingCheque}
        currencySymbol={currencySymbol}
      />
      <ClearChequeModal cheque={clearingCheque} onClose={() => setClearingCheque(null)} onSubmit={handleClearChequeSubmit} loading={loading} accounts={accounts} currencySymbol={currencySymbol} />
      <LoanModal
        isOpen={loanModalOpen}
        onClose={() => { setLoanModalOpen(false); setEditingLoan(null); }}
        onSubmit={handleLoanSubmit}
        loading={loading}
        loan={editingLoan}
        accounts={accounts}
        currencySymbol={currencySymbol}
      />
      <InstallmentModal loan={installmentsLoan} onClose={() => setInstallmentsLoan(null)} onSubmit={handleInstallmentSubmit} loading={loading} accounts={accounts} currencySymbol={currencySymbol} />

      {/* CONFIRMATION DIALOGS */}
      <ConfirmDialog isOpen={Boolean(deleteAccountTarget)} onClose={() => setDeleteAccountTarget(null)} onConfirm={handleDeleteAccount} title="Delete Account" message={`Are you sure you want to delete "${deleteAccountTarget?.name}"?`} loading={loading} />
      <ConfirmDialog isOpen={Boolean(deleteChequeTarget)} onClose={() => setDeleteChequeTarget(null)} onConfirm={handleDeleteCheque} title="Delete Cheque" message={`Delete cheque #${deleteChequeTarget?.chequeNumber}?`} loading={loading} />
      <ConfirmDialog isOpen={Boolean(deleteLoanTarget)} onClose={() => setDeleteLoanTarget(null)} onConfirm={handleDeleteLoan} title="Delete Loan" message={`Delete loan record for ${deleteLoanTarget?.personName}?`} loading={loading} />
    </div>
  );
}