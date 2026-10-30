"use client";

import { useState } from "react";
import { Plus, ArrowDownRight } from "lucide-react";
import { toast } from "sonner";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import PartnersTab from "./PartnersTab";
import DrawingsTab from "./DrawingsTab";
import RationsTab from "./RationsTab";
import PartnerModal from "./modals/PartnerModal";
import DrawingModal from "./modals/DrawingModal";
import RationModal from "./modals/RationModal";
import { IPartner, IPartnerTransaction, IPartnerRation } from "@/types/partner";
import {
 createPartnerAction,
  recordPartnerTransactionAction,
  recordPartnerRationAction,
  deletePartnerAction,
} from "@/app/actions/partner-actions";


export default function FamilyLedgerClient({
  partners,
  transactions,
  rations,
  accounts,
  products,
  currencySymbol = "৳",
}: {
  partners: IPartner[];
  transactions: IPartnerTransaction[];
  rations: IPartnerRation[];
  accounts: { id: string; name: string; type: string; currentBalance: number }[];
  products: { id: string; name: string; sku: string; purchasePrice: number }[];
  currencySymbol?: string;
}) {
  const [activeTab, setActiveTab] = useState<"partners" | "drawings" | "rations">("partners");

  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [drawingModalOpen, setDrawingModalOpen] = useState(false);
  const [rationModalOpen, setRationModalOpen] = useState(false);

  const [editingPartner, setEditingPartner] = useState<IPartner | null>(null);
  const [deletePartnerTarget, setDeletePartnerTarget] = useState<IPartner | null>(null);
  const [loading, setLoading] = useState(false);

  // Summary Balances
  const totalCapital = partners.reduce((sum, p) => sum + p.openingCapital, 0);
  const totalDrawings = partners.reduce((sum, p) => sum + (p.totalDrawings || 0), 0);
  const totalRations = partners.reduce((sum, p) => sum + (p.totalRations || 0), 0);
  const netBalance = partners.reduce((sum, p) => sum + p.currentBalance, 0);

  async function handlePartnerSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await createPartnerAction(formData);
    setLoading(false);

    if (res.success) {
      toast.success(editingPartner ? "Partner updated successfully!" : "Partner added successfully!");
      setPartnerModalOpen(false);
      setEditingPartner(null);
    } else {
      toast.error(res.error || "Operation failed.");
    }
  }

  async function handleDrawingSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await recordPartnerTransactionAction(formData);
    setLoading(false);

    if (res.success) {
      toast.success("Drawing recorded & account adjusted!");
      setDrawingModalOpen(false);
    } else {
      toast.error(res.error || "Transaction failed.");
    }
  }

  async function handleRationSubmit(data: { partnerId: string; items: { productId: string; quantity: number }[] }) {
    setLoading(true);
    const res = await recordPartnerRationAction(data);
    setLoading(false);

    if (res.success) {
      toast.success("Home groceries issued & stock deducted!");
      setRationModalOpen(false);
    } else {
      toast.error(res.error || "Failed to issue ration.");
    }
  }

  async function handleDeletePartner() {
    if (!deletePartnerTarget) return;
    setLoading(true);
    const res = await deletePartnerAction(deletePartnerTarget.id);
    setLoading(false);

    if (res.success) {
      toast.success("Partner deleted.");
      setDeletePartnerTarget(null);
    } else {
      toast.error(res.error || "Failed to delete partner.");
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Family Business Ledger" }]} />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">Total Partner Capital</span>
          <span className="text-2xl font-black text-neutral-900 dark:text-neutral-100 font-mono">
            {currencySymbol}{totalCapital.toLocaleString()}
          </span>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500 block mb-2">Total Drawings & Bills</span>
          <span className="text-2xl font-black text-rose-600 font-mono">
            {currencySymbol}{totalDrawings.toLocaleString()}
          </span>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500 block mb-2">Home Groceries (Cost)</span>
          <span className="text-2xl font-black text-amber-600 font-mono">
            {currencySymbol}{totalRations.toLocaleString()}
          </span>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500 block mb-2">Net Family Equity</span>
          <span className="text-2xl font-black text-emerald-600 font-mono">
            {currencySymbol}{netBalance.toLocaleString()}
          </span>
        </div>
      </div>

      {/* TABS HEADER */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("partners")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "partners" ? "bg-blue-600 text-white shadow-xs" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600"
            }`}
          >
            👥 Partners ({partners.length})
          </button>
          <button
            onClick={() => setActiveTab("drawings")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "drawings" ? "bg-blue-600 text-white shadow-xs" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600"
            }`}
          >
            💸 Drawings & Bills ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab("rations")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "rations" ? "bg-blue-600 text-white shadow-xs" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600"
            }`}
          >
            🛒 Home Groceries ({rations.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "partners" && (
            <button
              onClick={() => { setEditingPartner(null); setPartnerModalOpen(true); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus size={15} /> Add Partner
            </button>
          )}
          {activeTab === "drawings" && (
            <button
              onClick={() => setDrawingModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
            >
              <ArrowDownRight size={15} /> Record Drawing
            </button>
          )}
          {activeTab === "rations" && (
            <button
              onClick={() => setRationModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus size={15} /> Issue Groceries
            </button>
          )}
        </div>
      </div>

      {/* RENDER ACTIVE TAB */}
      {activeTab === "partners" && (
        <PartnersTab
          partners={partners}
          currencySymbol={currencySymbol}
          onEdit={(p) => { setEditingPartner(p); setPartnerModalOpen(true); }}
          onDelete={setDeletePartnerTarget}
        />
      )}
      {activeTab === "drawings" && <DrawingsTab transactions={transactions} currencySymbol={currencySymbol} />}
      {activeTab === "rations" && <RationsTab rations={rations} currencySymbol={currencySymbol} />}

      {/* MODALS */}
      <PartnerModal
        isOpen={partnerModalOpen}
        onClose={() => { setPartnerModalOpen(false); setEditingPartner(null); }}
        onSubmit={handlePartnerSubmit}
        loading={loading}
        partner={editingPartner}
      />
      <DrawingModal
        isOpen={drawingModalOpen}
        onClose={() => setDrawingModalOpen(false)}
        onSubmit={handleDrawingSubmit}
        loading={loading}
        partners={partners}
        accounts={accounts}
      />
      <RationModal
        isOpen={rationModalOpen}
        onClose={() => setRationModalOpen(false)}
        onSubmit={handleRationSubmit}
        loading={loading}
        partners={partners}
        products={products}
      />

      {/* CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(deletePartnerTarget)}
        onClose={() => setDeletePartnerTarget(null)}
        onConfirm={handleDeletePartner}
        title="Delete Partner"
        message={`Are you sure you want to delete partner "${deletePartnerTarget?.name}"?`}
        loading={loading}
      />
    </div>
  );
}