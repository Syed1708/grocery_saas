// app/dashboard/admin/purchases/_components/PurchasesClient.tsx
"use client";
"use no memo";

import { useState } from "react";
import Link from "next/link";
import { Receipt, Truck, DollarSign, Plus, PackagePlus } from "lucide-react";
import { toast } from "sonner";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import FormModal from "@/components/common/FormModal";
import ConfirmDialog from "@/components/common/ConfirmDialog";

// Modular Tabs
import InvoicesTab from "./tabs/InvoicesTab";
import SuppliersTab from "./tabs/SuppliersTab";
import SupplierDuesTab from "./tabs/SupplierDuesTab";

// Modular Dialogs & Utilities
import ViewInvoiceModal from "./modals/ViewInvoiceModal";
import SupplierPaymentModal from "./modals/SupplierPaymentModal";
import SupplierHistoryModal from "./modals/SupplierHistoryModal";
import { printPurchaseInvoice, printSupplierVoucher } from "./print-utils";

// Actions
import { deletePurchaseAction } from "@/app/actions/purchase-actions";
import {
  createSupplierAction,
  updateSupplierAction,
  deleteSupplierAction,
} from "@/app/actions/supplier-actions";
import { ISupplier } from "@/types";

export default function PurchasesClient({
  purchases,
  suppliers,
  currencySymbol = "৳",
  shopName = "Grocery Store",
}: {
  purchases: any[];
  suppliers: any[];
  currencySymbol?: string;
  shopName?: string;
}) {
  const [activeTab, setActiveTab] = useState<"invoices" | "suppliers" | "dues">("invoices");
  const [loading, setLoading] = useState(false);

  // Modal Targets
  const [viewInvoice, setViewInvoice] = useState<any | null>(null);
  const [deletePurchaseTarget, setDeletePurchaseTarget] = useState<any | null>(null);

  const [activeSupplierForPayment, setActiveSupplierForPayment] = useState<any | null>(null);
  const [activeSupplierForHistory, setActiveSupplierForHistory] = useState<any | null>(null);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<ISupplier | null>(null);
  const [deleteSupplierTarget, setDeleteSupplierTarget] = useState<ISupplier | null>(null);

  // Delete Purchase Action
  async function handleDeletePurchaseConfirm() {
    if (!deletePurchaseTarget) return;
    setLoading(true);
    const res = await deletePurchaseAction(deletePurchaseTarget.id);
    setLoading(false);
    if (res.success) {
      toast.success(`Chalan #${deletePurchaseTarget.chalanNo} deleted.`);
      setDeletePurchaseTarget(null);
    } else {
      toast.error(res.error || "Failed to delete purchase.");
    }
  }

  // Create / Update Supplier Action
  async function handleSupplierSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    if (editingSupplier) formData.append("id", editingSupplier.id);

    const res = editingSupplier
      ? await updateSupplierAction(formData)
      : await createSupplierAction(formData);

    setLoading(false);
    if (res.success) {
      toast.success(editingSupplier ? "Supplier updated!" : "Supplier created!");
      setSupplierModalOpen(false);
    } else {
      toast.error(res.error || "Operation failed.");
    }
  }

  // Delete Supplier Action
  async function handleDeleteSupplierConfirm() {
    if (!deleteSupplierTarget) return;
    setLoading(true);
    const res = await deleteSupplierAction(deleteSupplierTarget.id);
    setLoading(false);
    if (res.success) {
      toast.success(`Supplier "${deleteSupplierTarget.companyName}" deleted.`);
      setDeleteSupplierTarget(null);
    } else {
      toast.error(res.error || "Failed to delete supplier.");
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Purchases & Procurement" }]} />

      {/* Primary Tabs Bar */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab("invoices")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeTab === "invoices"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200"
            }`}
          >
            <Receipt size={14} /> Purchase Invoices ({purchases.length})
          </button>

          <button
            onClick={() => setActiveTab("suppliers")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeTab === "suppliers"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200"
            }`}
          >
            <Truck size={14} /> Suppliers &amp; Vendors ({suppliers.length})
          </button>

          <button
            onClick={() => setActiveTab("dues")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeTab === "dues"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200"
            }`}
          >
            <DollarSign size={14} /> Supplier Dues (বাকির খাতা)
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {activeTab === "invoices" && (
            <Link
              href="/dashboard/admin/purchases/create"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition"
            >
              <PackagePlus size={16} /> New Purchase Bill
            </Link>
          )}

          {activeTab === "suppliers" && (
            <button
              onClick={() => {
                setEditingSupplier(null);
                setSupplierModalOpen(true);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus size={16} /> Add Supplier
            </button>
          )}
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === "invoices" && (
        <InvoicesTab
          purchases={purchases}
          currencySymbol={currencySymbol}
          onView={(p) => setViewInvoice(p)}
          onPrint={(p) => printPurchaseInvoice({ invoice: p, shopName, currencySymbol })}
          onDelete={(p) => setDeletePurchaseTarget(p)}
        />
      )}

      {activeTab === "suppliers" && (
        <SuppliersTab
          suppliers={suppliers}
          currencySymbol={currencySymbol}
          onEdit={(s) => {
            setEditingSupplier(s);
            setSupplierModalOpen(true);
          }}
          onDelete={(s) => setDeleteSupplierTarget(s)}
          onPay={(s) => setActiveSupplierForPayment(s)}
          onHistory={(s) => setActiveSupplierForHistory(s)}
        />
      )}

      {activeTab === "dues" && (
        <SupplierDuesTab
          suppliers={suppliers}
          currencySymbol={currencySymbol}
          onPay={(s) => setActiveSupplierForPayment(s)}
          onHistory={(s) => setActiveSupplierForHistory(s)}
        />
      )}

      {/* Modular Modals */}
      <ViewInvoiceModal
        invoice={viewInvoice}
        onClose={() => setViewInvoice(null)}
        onPrint={(inv) => printPurchaseInvoice({ invoice: inv, shopName, currencySymbol })}
        currencySymbol={currencySymbol}
      />

      <SupplierPaymentModal
        supplier={activeSupplierForPayment}
        isOpen={Boolean(activeSupplierForPayment)}
        onClose={() => setActiveSupplierForPayment(null)}
        onSuccess={(payment) =>
          printSupplierVoucher({ details: payment, shopName, currencySymbol })
        }
        currencySymbol={currencySymbol}
      />

      <SupplierHistoryModal
        supplier={activeSupplierForHistory}
        isOpen={Boolean(activeSupplierForHistory)}
        onClose={() => setActiveSupplierForHistory(null)}
        onPrintVoucher={(p) =>
          printSupplierVoucher({
            details: {
              voucherNo: p.voucherNo,
              supplierName: activeSupplierForHistory.name,
              companyName: activeSupplierForHistory.companyName,
              phone: activeSupplierForHistory.phone,
              amountPaid: p.amount,
              previousDue: p.amount,
              remainingDue: 0,
              paymentMethod: p.paymentMethod,
              reference: p.reference,
              date: p.createdAt,
            },
            shopName,
            currencySymbol,
          })
        }
        currencySymbol={currencySymbol}
      />

      {/* Supplier Create/Edit FormModal */}
      <FormModal
        isOpen={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        onSubmit={handleSupplierSubmit}
        title={editingSupplier ? "Edit Supplier" : "Register New Supplier"}
        description="Vendor details for stock bills and ledger."
        isEditing={Boolean(editingSupplier)}
        loading={loading}
        maxWidth="md"
      >
        <div>
          <label className="block text-xs font-medium mb-1">Company / Distributor Name *</label>
          <input
            type="text"
            name="companyName"
            required
            defaultValue={editingSupplier?.companyName || ""}
            className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Contact Person *</label>
          <input
            type="text"
            name="name"
            required
            defaultValue={editingSupplier?.name || ""}
            className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Phone Number *</label>
          <input
            type="text"
            name="phone"
            required
            defaultValue={editingSupplier?.phone || ""}
            className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
          />
        </div>
      </FormModal>

      {/* Confirm Deletion Dialogs */}
      <ConfirmDialog
        isOpen={Boolean(deletePurchaseTarget)}
        onClose={() => setDeletePurchaseTarget(null)}
        onConfirm={handleDeletePurchaseConfirm}
        title="Delete Purchase Bill"
        message={`Are you sure you want to delete Chalan #${deletePurchaseTarget?.chalanNo}? This will rollback stock and deduct ${currencySymbol}${Number(deletePurchaseTarget?.dueAmount || 0).toFixed(2)} from the supplier's due balance.`}
        confirmLabel="Delete & Rollback"
        loading={loading}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteSupplierTarget)}
        onClose={() => setDeleteSupplierTarget(null)}
        onConfirm={handleDeleteSupplierConfirm}
        title="Delete Supplier"
        message={`Are you sure you want to delete "${deleteSupplierTarget?.companyName}"?`}
        confirmLabel="Delete Supplier"
        loading={loading}
      />
    </div>
  );
}