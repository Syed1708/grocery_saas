"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, ArrowDownRight, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { StatCard } from "@/components/common/StatCard";
import { Input } from "@/components/common/ui/Input";
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
  updatePartnerTransactionAction,
  deletePartnerTransactionAction,
  recordPartnerRationAction,
  updatePartnerRationAction,
  deletePartnerRationAction,
  deletePartnerAction,
} from "@/app/actions/partner-actions";

export default function FamilyLedgerClient({
  partners,
  transactions,
  rations,
  accounts,
  products,
  currencySymbol = "৳",
  shop,
  branchName,
}: {
  partners: IPartner[];
  transactions: IPartnerTransaction[];
  rations: IPartnerRation[];
  accounts: { id: string; name: string; type: string; currentBalance: number }[];
  products: { id: string; name: string; sku: string; purchasePrice: number }[];
  currencySymbol?: string;
  shop: { name: string; phone?: string | null; address?: string | null };
  branchName: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: "partners" | "drawings" | "rations" =
    tabParam === "drawings" || tabParam === "rations" ? tabParam : "partners";

  const setActiveTab = (tab: "partners" | "drawings" | "rations") => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "partners") params.delete("tab");
    else params.set("tab", tab);
    router.push(`${pathname}?${params.toString()}`);
  };

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("startDate");
    params.delete("endDate");
    params.delete("partnerId");
    params.delete("type");
    router.push(`${pathname}?${params.toString()}`);
  };

  const hasFilters = Boolean(
    searchParams.get("startDate") ||
      searchParams.get("endDate") ||
      searchParams.get("partnerId") ||
      searchParams.get("type")
  );

  const [drawingModalOpen, setDrawingModalOpen] = useState(false);
  const [rationModalOpen, setRationModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [editingDrawing, setEditingDrawing] = useState<IPartnerTransaction | null>(null);
  const [deleteDrawingTarget, setDeleteDrawingTarget] = useState<IPartnerTransaction | null>(null);
  const [editingRation, setEditingRation] = useState<IPartnerRation | null>(null);
  const [deleteRationTarget, setDeleteRationTarget] = useState<IPartnerRation | null>(null);

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
    const res = editingDrawing
      ? await updatePartnerTransactionAction(formData)
      : await recordPartnerTransactionAction(formData);
    setActionLoading(false);

    if (res.success) {
      toast.success(editingDrawing ? "Drawing updated & account adjusted!" : "Drawing recorded & account adjusted!");
      setDrawingModalOpen(false);
      setEditingDrawing(null);
    } else {
      toast.error(res.error || "Transaction failed.");
    }
  }

  async function handleRationSubmit(data: {
    partnerId: string;
    items: { productId: string; quantity: number }[];
  }) {
    setActionLoading(true);
    const res = editingRation
      ? await updatePartnerRationAction(editingRation.id, data)
      : await recordPartnerRationAction(data);
    setActionLoading(false);

    if (res.success) {
      toast.success(editingRation ? "Ration updated & stock adjusted!" : "Home groceries issued & stock deducted!");
      setRationModalOpen(false);
      setEditingRation(null);
    } else {
      toast.error(res.error || "Failed to issue ration.");
    }
  }

  async function handleDeleteDrawing() {
    if (!deleteDrawingTarget) return;
    setActionLoading(true);
    const res = await deletePartnerTransactionAction(deleteDrawingTarget.id);
    setActionLoading(false);

    if (res.success) {
      toast.success("Drawing deleted & account reversed.");
      setDeleteDrawingTarget(null);
    } else {
      toast.error(res.error || "Failed to delete drawing.");
    }
  }

  async function handleDeleteRation() {
    if (!deleteRationTarget) return;
    setActionLoading(true);
    const res = await deletePartnerRationAction(deleteRationTarget.id);
    setActionLoading(false);

    if (res.success) {
      toast.success("Ration deleted & stock restored.");
      setDeleteRationTarget(null);
    } else {
      toast.error(res.error || "Failed to delete ration.");
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
              onClick={() => { setEditingDrawing(null); setDrawingModalOpen(true); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
            >
              <ArrowDownRight size={15} /> Record Drawing
            </button>
          )}
          {activeTab === "rations" && (
            <button
              onClick={() => { setEditingRation(null); setRationModalOpen(true); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus size={15} /> Issue Groceries
            </button>
          )}
        </div>
      </div>

      {/* HISTORY FILTERS */}
      {activeTab !== "partners" && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold">History Filters</span>
              <span className="text-[10px] text-neutral-500 ml-2">
                Showing {activeTab === "drawings" ? transactions.length : rations.length} records
              </span>
            </div>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
              >
                <RotateCcw size={12} /> Reset Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <Input
              type="date"
              value={searchParams.get("startDate") || ""}
              onChange={(e) => setFilter("startDate", e.target.value)}
              aria-label="Start date"
            />
            <Input
              type="date"
              value={searchParams.get("endDate") || ""}
              onChange={(e) => setFilter("endDate", e.target.value)}
              aria-label="End date"
            />
            <select
              value={searchParams.get("partnerId") || "all"}
              onChange={(e) => setFilter("partnerId", e.target.value)}
              aria-label="Filter by partner"
              className="text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 outline-none cursor-pointer"
            >
              <option value="all">All Partners</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {activeTab === "drawings" ? (
              <select
                value={searchParams.get("type") || "all"}
                onChange={(e) => setFilter("type", e.target.value)}
                aria-label="Filter by transaction type"
                className="text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 outline-none cursor-pointer"
              >
                <option value="all">All Transaction Types</option>
                <option value="CASH_DRAWING">Cash Drawings</option>
                <option value="BANK_DRAWING">Bank Drawings</option>
                <option value="HOUSEHOLD_EXPENSE">Household Bills</option>
                <option value="CAPITAL_INJECTION">Capital Injections</option>
                <option value="PROFIT_DISTRIBUTION">Profit Distribution</option>
              </select>
            ) : (
              <div className="text-[11px] text-neutral-500 flex items-center px-1">
                Filter grocery rations by date or partner.
              </div>
            )}
          </div>
        </div>
      )}

      {/* RENDER ACTIVE TAB */}
      {activeTab === "partners" && (
        <PartnersTab
          partners={partners}
          currencySymbol={currencySymbol}
          onEdit={partnerCrud.openEdit}
          onDelete={partnerCrud.setDeleteTarget}
        />
      )}
      {activeTab === "drawings" && (
        <DrawingsTab
          transactions={transactions}
          currencySymbol={currencySymbol}
          shop={shop}
          branchName={branchName}
          onEdit={(t) => { setEditingDrawing(t); setDrawingModalOpen(true); }}
          onDelete={setDeleteDrawingTarget}
        />
      )}
      {activeTab === "rations" && (
        <RationsTab
          rations={rations}
          currencySymbol={currencySymbol}
          shop={shop}
          branchName={branchName}
          onEdit={(r) => { setEditingRation(r); setRationModalOpen(true); }}
          onDelete={setDeleteRationTarget}
        />
      )}

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
        key={editingDrawing?.id || `drawing-${drawingModalOpen}`}
        isOpen={drawingModalOpen}
        onClose={() => { setDrawingModalOpen(false); setEditingDrawing(null); }}
        onSubmit={handleDrawingSubmit}
        loading={actionLoading}
        partners={partners}
        accounts={accounts}
        transaction={editingDrawing}
      />
      <RationModal
        key={editingRation?.id || `ration-${rationModalOpen}`}
        isOpen={rationModalOpen}
        onClose={() => { setRationModalOpen(false); setEditingRation(null); }}
        onSubmit={handleRationSubmit}
        loading={actionLoading}
        partners={partners}
        products={products}
        ration={editingRation}
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

      <ConfirmDialog
        isOpen={Boolean(deleteDrawingTarget)}
        onClose={() => setDeleteDrawingTarget(null)}
        onConfirm={handleDeleteDrawing}
        title="Delete Drawing / Bill"
        message={`Delete voucher #${deleteDrawingTarget?.voucherNo}? The account effect will be reversed.`}
        loading={actionLoading}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteRationTarget)}
        onClose={() => setDeleteRationTarget(null)}
        onConfirm={handleDeleteRation}
        title="Delete Home Grocery Ration"
        message={`Delete ration #${deleteRationTarget?.rationNo}? Its stock will be restored.`}
        loading={actionLoading}
      />
    </div>
  );
}
