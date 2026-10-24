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
import {
  createAccountAction,
  transferFundsAction,
  createChequeAction,
  clearChequeAction,
} from "@/app/actions/account-actions";
import { createLoanAction, addLoanInstallmentAction } from "@/app/actions/loan-actions";
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
  const [clearingCheque, setClearingCheque] = useState<IBankCheque | null>(null);
  const [installmentsLoan, setInstallmentsLoan] = useState<ILoan | null>(null);
  const [loading, setLoading] = useState(false);

  // Summary balances
  const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);
  const cashBalance = accounts.filter((a) => a.type === "CASH").reduce((sum, a) => sum + a.currentBalance, 0);
  const bankBalance = accounts.filter((a) => a.type === "BANK").reduce((sum, a) => sum + a.currentBalance, 0);
  const mfsBalance = accounts.filter((a) => ["BKASH", "NAGAD", "ROCKET"].includes(a.type)).reduce((sum, a) => sum + a.currentBalance, 0);

  async function handleAccountSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await createAccountAction(formData);
    setLoading(false);
    if (res.success) {
      toast.success("Account created successfully!");
      setAccountModalOpen(false);
    } else {
      toast.error(res.error || "Failed to create account.");
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
    const res = await createChequeAction(formData);
    setLoading(false);
    if (res.success) {
      toast.success("Cheque logged successfully!");
      setChequeModalOpen(false);
    } else {
      toast.error(res.error || "Failed to log cheque.");
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
    const res = await createLoanAction(formData);
    setLoading(false);
    if (res.success) {
      toast.success("Loan recorded successfully!");
      setLoanModalOpen(false);
    } else {
      toast.error(res.error || "Failed to record loan.");
    }
  }

  async function handleInstallmentSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!installmentsLoan) return;
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.append("loanId", installmentsLoan.id);
    const res = await addLoanInstallmentAction(formData);
    setLoading(false);
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
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "accounts" ? "bg-blue-600 text-white shadow-xs" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600"
            }`}
          >
            🏦 Accounts ({accounts.length})
          </button>
          <button
            onClick={() => setActiveTab("cheques")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "cheques" ? "bg-blue-600 text-white shadow-xs" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600"
            }`}
          >
            📜 Cheques ({cheques.length})
          </button>
          <button
            onClick={() => setActiveTab("loans")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "loans" ? "bg-blue-600 text-white shadow-xs" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600"
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
              onClick={() => setAccountModalOpen(true)}
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
      {activeTab === "accounts" && <AccountsTab accounts={accounts} currencySymbol={currencySymbol} />}
      {activeTab === "cheques" && <ChequesTab cheques={cheques} currencySymbol={currencySymbol} onClearCheque={setClearingCheque} />}
      {activeTab === "loans" && <LoansTab loans={loans} currencySymbol={currencySymbol} onPayInstallment={setInstallmentsLoan} />}

      {/* MODALS */}
      <AccountModal isOpen={accountModalOpen} onClose={() => setAccountModalOpen(false)} onSubmit={handleAccountSubmit} loading={loading} currencySymbol={currencySymbol} />
      <TransferModal isOpen={transferModalOpen} onClose={() => setTransferModalOpen(false)} onSubmit={handleTransferSubmit} loading={loading} accounts={accounts} currencySymbol={currencySymbol} />
      <ChequeModal isOpen={chequeModalOpen} onClose={() => setChequeModalOpen(false)} onSubmit={handleChequeSubmit} loading={loading} currencySymbol={currencySymbol} />
      <ClearChequeModal cheque={clearingCheque} onClose={() => setClearingCheque(null)} onSubmit={handleClearChequeSubmit} loading={loading} accounts={accounts} currencySymbol={currencySymbol} />
      <LoanModal isOpen={loanModalOpen} onClose={() => setLoanModalOpen(false)} onSubmit={handleLoanSubmit} loading={loading} accounts={accounts} currencySymbol={currencySymbol} />
      <InstallmentModal loan={installmentsLoan} onClose={() => setInstallmentsLoan(null)} onSubmit={handleInstallmentSubmit} loading={loading} accounts={accounts} currencySymbol={currencySymbol} />
    </div>
  );
}