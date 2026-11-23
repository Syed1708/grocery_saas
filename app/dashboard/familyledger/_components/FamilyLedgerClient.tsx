"use client";

import { useState } from "react";
import { Plus, ArrowDownRight } from "lucide-react";
import { toast } from "sonner";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { StatCard } from "@/components/common/StatCard";
import { useCrudModal } from "@/hooks/useCrudModal";
import PartnersTab from "./PartnersTab";
import DrawingsTab from "./DrawingsTab";
import RationsTab from "./RationsTab";
import PartnerModal from "./modals/PartnerModal";
import DrawingModal from "./modals/DrawingModal";
import RationModal from "./modals/RationModal";
import { IPartner, IPartnerTransaction, IPartnerRation } from "@/types/partner";
import {
  createPartnerAction,
  updatePartnerAction,
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
  const [drawingModalOpen, setDrawingModalOpen] = useState(false);
  const [rationModalOpen, setRationModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const partnerCrud = useCrudModal<IPartner>({
    createAction: createPartnerAction,
    updateAction: updatePartnerAction,
    deleteAction: deletePartnerAction,
    entityName: "পার্টনার",
  });

  // Summary Balances
  const totalCapital = partners.reduce((sum, p) => sum + p.openingCapital, 0);
  const totalDrawings = partners.reduce((sum, p) => sum + (p.totalDrawings || 0), 0);
  const totalRations = partners.reduce((sum, p) => sum + (p.totalRations || 0), 0);
  const netBalance = partners.reduce((sum, p) => sum + p.currentBalance, 0);

  async function handleDrawingSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setActionLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await recordPartnerTransactionAction(formData);
    setActionLoading(false);

    if (res.success) {
      toast.success("Drawing recorded & account adjusted!");
      setDrawingModalOpen(false);
    } else {
      toast.error(res.error || "Transaction failed.");
    }
  }

  async function handleRationSubmit(data: {
    partnerId: string;
    items: { productId: string; quantity: number }[];
  }) {
    setActionLoading(true);
    const res = await recordPartnerRationAction(data);
    setActionLoading(false);

    if (res.success) {
      toast.success("Home groceries issued & stock deducted!");
      setRationModalOpen(false);
    } else {
      toast.error(res.error || "Failed to issue ration.");
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Family Business Ledger" }]} />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Partner Capital" value={`${currencySymbol}${totalCapital.toLocaleString()}`} tone="neutral" />
        <StatCard title="Total Drawings & Bills" value={`${currencySymbol}${totalDrawings.toLocaleString()}`} tone="rose" />
        <StatCard title="Home Groceries (Cost)" value={`${currencySymbol}${totalRations.toLocaleString()}`} tone="amber" />
        <StatCard title="Net Family Equity" value={`${currencySymbol}${netBalance.toLocaleString()}`} tone="emerald" />
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
              onClick={partnerCrud.openCreate}
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
          onEdit={partnerCrud.openEdit}
          onDelete={partnerCrud.setDeleteTarget}
        />
      )}
      {activeTab === "drawings" && <DrawingsTab transactions={transactions} currencySymbol={currencySymbol} />}
      {activeTab === "rations" && <RationsTab rations={rations} currencySymbol={currencySymbol} />}

      {/* MODALS */}
      <PartnerModal
        key={partnerCrud.editingItem?.id || "new-partner"}
        isOpen={partnerCrud.isOpen}
        onClose={partnerCrud.closeModal}
        onSubmit={partnerCrud.handleSubmit}
        loading={partnerCrud.loading}
        partner={partnerCrud.editingItem}
        errors={partnerCrud.errors}
      />
      <DrawingModal
        key={`drawing-${drawingModalOpen}`}
        isOpen={drawingModalOpen}
        onClose={() => setDrawingModalOpen(false)}
        onSubmit={handleDrawingSubmit}
        loading={actionLoading}
        partners={partners}
        accounts={accounts}
      />
      <RationModal
        key={`ration-${rationModalOpen}`}
        isOpen={rationModalOpen}
        onClose={() => setRationModalOpen(false)}
        onSubmit={handleRationSubmit}
        loading={actionLoading}
        partners={partners}
        products={products}
      />

      {/* CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(partnerCrud.deleteTarget)}
        onClose={() => partnerCrud.setDeleteTarget(null)}
        onConfirm={partnerCrud.handleDeleteConfirm}
        title="Delete Partner"
        message={`Are you sure you want to delete partner "${partnerCrud.deleteTarget?.name}"?`}
        loading={partnerCrud.loading}
      />
    </div>
  );
}
