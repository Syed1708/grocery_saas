"use client";

import React, { useState } from "react";
import { AlertOctagon, ArrowLeftRight, Plus } from "lucide-react";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { toast } from "sonner";

// Types
import { IStockWastage } from "@/types/stock-wastage";
import { IStockTransfer } from "@/types/stock-transfer";

// Tabs
import WastageTab from "../_components/tabs/WastageTab";
import TransfersTab from "../_components/tabs/TransfersTab";

// Modals
import RecordWastageModal from "../_components/modals/RecordWastageModal";
import ViewWastageModal from "../_components/modals/ViewWastageModal";
import EditWastageModal from "../_components/modals/EditWastageModal";
import CreateTransferModal from "../_components/modals/CreateTransferModal";
import ReceiveTransferModal from "../_components/modals/ReceiveTransferModal";
import ViewTransferModal from "../_components/modals/ViewTransferModal";
import EditTransferModal from "../_components/modals/EditTransferModal";
import ConfirmDialog from "@/components/common/ConfirmDialog";

// Prints
import WastageSlipPrint from "../_components/print/WastageSlipPrint";
import TransferChalanPrint from "../_components/print/TransferChalanPrint";

// Actions
import { deleteStockWastageAction } from "@/app/actions/stock-wastage-actions";
import { cancelTransferAction } from "@/app/actions/stock-transfer-actions";

interface Props {
  wastages: IStockWastage[];
  transfers?: IStockTransfer[];
  branches?: any[];
  currentBranchId: string;
  suppliers?: any[];
  products: any[];
  currencySymbol?: string;
  shopName: string;
  userRole?: string;
}

export default function StockClient({
  wastages = [],
  transfers = [],
  branches = [],
  currentBranchId,
  suppliers = [],
  products = [],
  currencySymbol = "৳",
  shopName,
  userRole = "OWNER",
}: Props) {
  const [activeTab, setActiveTab] = useState<"wastage" | "transfers">("wastage");
  const [loading, setLoading] = useState(false);

  // Wastage Modals & Targets
  const [createWastageOpen, setCreateWastageOpen] = useState(false);
  const [viewingWastage, setViewingWastage] = useState<IStockWastage | null>(null);
  const [editingWastage, setEditingWastage] = useState<IStockWastage | null>(null);
  const [deletingWastage, setDeletingWastage] = useState<IStockWastage | null>(null);
  const [printWastage, setPrintWastage] = useState<IStockWastage | null>(null);

  // Transfer Modals & Targets
  const [createTransferOpen, setCreateTransferOpen] = useState(false);
  const [receivingTransfer, setReceivingTransfer] = useState<IStockTransfer | null>(null);
  const [viewingTransfer, setViewingTransfer] = useState<IStockTransfer | null>(null);
  const [editingTransfer, setEditingTransfer] = useState<IStockTransfer | null>(null);
  const [cancellingTransfer, setCancellingTransfer] = useState<IStockTransfer | null>(null);
  const [printTransfer, setPrintTransfer] = useState<IStockTransfer | null>(null);

  // Print Handlers
  const handlePrintWastage = (w: IStockWastage) => {
    setPrintTransfer(null);
    setPrintWastage(w);
    requestAnimationFrame(() => setTimeout(() => window.print(), 80));
  };

  const handlePrintTransfer = (t: IStockTransfer) => {
    setPrintWastage(null);
    setPrintTransfer(t);
    requestAnimationFrame(() => setTimeout(() => window.print(), 80));
  };

  // Delete Wastage Action
  const handleDeleteWastageConfirm = async () => {
    if (!deletingWastage) return;
    setLoading(true);
    const res = await deleteStockWastageAction(deletingWastage.id);
    setLoading(false);

    if (res.success) {
      toast.success(`ভাউচার #${deletingWastage.wastageNo} মুছে ফেলা হয়েছে ও স্টক রোলব্যাক সম্পন্ন!`);
      setDeletingWastage(null);
    } else {
      toast.error(res.error || "মুছে ফেলা সম্ভব হয়নি।");
    }
  };

  // Cancel Transfer Action
  const handleCancelTransferConfirm = async () => {
    if (!cancellingTransfer) return;
    setLoading(true);
    const res = await cancelTransferAction(cancellingTransfer.id);
    setLoading(false);

    if (res.success) {
      toast.success(`চালান #${cancellingTransfer.transferNo} সফলভাবে বাতিল ও স্টক ফেরত সম্পন্ন!`);
      setCancellingTransfer(null);
    } else {
      toast.error(res.error || "চালান বাতিল করা সম্ভব হয়নি।");
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "স্টক ও গুদাম ব্যবস্থাপনা (Stock Operations)" }]} />

      {/* Primary Tabs Navigation Bar */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab("wastage")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeTab === "wastage"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200"
            }`}
          >
            <AlertOctagon size={14} /> নষ্ট ও ক্ষতিপূরণ লগ ({wastages.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("transfers")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeTab === "transfers"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200"
            }`}
          >
            <ArrowLeftRight size={14} /> ব্রাঞ্চ স্টক স্থানান্তর ({transfers.length})
          </button>
        </div>

        {/* Dynamic Contextual Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {activeTab === "wastage" && (
            <button
              type="button"
              onClick={() => setCreateWastageOpen(true)}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus size={16} /> নতুন নষ্ট মাল এন্ট্রি (Record Spoilage)
            </button>
          )}

          {activeTab === "transfers" && (
            <button
              type="button"
              onClick={() => setCreateTransferOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus size={16} /> নতুন স্টক স্থানান্তর (New Transfer)
            </button>
          )}
        </div>
      </div>

      {/* 1. Wastage Tab */}
      {activeTab === "wastage" && (
        <WastageTab
          wastages={wastages}
          currencySymbol={currencySymbol}
          onView={(w) => setViewingWastage(w)}
          onEdit={(w) => setEditingWastage(w)}
          onPrint={(w) => handlePrintWastage(w)}
          onDelete={userRole === "OWNER" ? (w) => setDeletingWastage(w) : undefined}
        />
      )}

      {/* 2. Transfers Tab */}
      {activeTab === "transfers" && (
        <TransfersTab
          transfers={transfers}
          currentBranchId={currentBranchId}
          currencySymbol={currencySymbol}
          onReceive={(t) => setReceivingTransfer(t)}
          onView={(t) => setViewingTransfer(t)}
          onEdit={(t) => setEditingTransfer(t)}
          onPrint={(t) => handlePrintTransfer(t)}
          onCancel={(t) => setCancellingTransfer(t)}
        />
      )}

      {/* Wastage Modals */}
      <RecordWastageModal
        isOpen={createWastageOpen}
        onClose={() => setCreateWastageOpen(false)}
        products={products}
        suppliers={suppliers}
        currencySymbol={currencySymbol}
      />

      {viewingWastage && (
        <ViewWastageModal
          key={viewingWastage.id}
          wastage={viewingWastage}
          onClose={() => setViewingWastage(null)}
          currencySymbol={currencySymbol}
        />
      )}

      {editingWastage && (
        <EditWastageModal
          key={editingWastage.id}
          wastage={editingWastage}
          onClose={() => setEditingWastage(null)}
          currencySymbol={currencySymbol}
        />
      )}

      {/* Transfer Modals */}
      <CreateTransferModal
        isOpen={createTransferOpen}
        onClose={() => setCreateTransferOpen(false)}
        branches={branches}
        currentBranchId={currentBranchId}
        products={products}
        currencySymbol={currencySymbol}
      />

      {receivingTransfer && (
        <ReceiveTransferModal
          key={receivingTransfer.id}
          transfer={receivingTransfer}
          onClose={() => setReceivingTransfer(null)}
          currencySymbol={currencySymbol}
        />
      )}

      {viewingTransfer && (
        <ViewTransferModal
          key={viewingTransfer.id}
          transfer={viewingTransfer}
          onClose={() => setViewingTransfer(null)}
          currencySymbol={currencySymbol}
        />
      )}

      {editingTransfer && (
        <EditTransferModal
          key={editingTransfer.id}
          transfer={editingTransfer}
          onClose={() => setEditingTransfer(null)}
          currencySymbol={currencySymbol}
        />
      )}

      {/* Confirmation: Delete Wastage */}
      <ConfirmDialog
        isOpen={Boolean(deletingWastage)}
        onClose={() => setDeletingWastage(null)}
        onConfirm={handleDeleteWastageConfirm}
        title="নষ্ট মাল রেকর্ড মুছে ফেলুন"
        message={`আপনি কি নিশ্চিতভাবে ভাউচার #${deletingWastage?.wastageNo} মুছে ফেলতে চান? এর ফলে মালামাল ব্রাঞ্চের স্টকে পুনরায় যোগ করা হবে।`}
        confirmLabel="মুছে ফেলুন ও স্টক রোলব্যাক"
        loading={loading}
      />

      {/* Confirmation: Cancel Transfer */}
      <ConfirmDialog
        isOpen={Boolean(cancellingTransfer)}
        onClose={() => setCancellingTransfer(null)}
        onConfirm={handleCancelTransferConfirm}
        title="স্থানান্তর চালান বাতিল করুন"
        message={`আপনি কি নিশ্চিতভাবে চালান #${cancellingTransfer?.transferNo} বাতিল করতে চান? প্রেরিত মালামাল পুনরায় বর্তমান ব্রাঞ্চের স্টকে যোগ হবে।`}
        confirmLabel="চালান বাতিল ও স্টক ফেরত"
        loading={loading}
      />

      {/* Print Templates */}
      <WastageSlipPrint
        data={printWastage}
        shopName={shopName}
        currencySymbol={currencySymbol}
      />

      <TransferChalanPrint
        data={printTransfer}
        shopName={shopName}
        currencySymbol={currencySymbol}
      />
    </div>
  );
}