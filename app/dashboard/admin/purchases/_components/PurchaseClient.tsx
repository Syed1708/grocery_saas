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

// Modular Modals
import ViewInvoiceModal from "./modals/ViewInvoiceModal";
import SupplierPaymentModal from "./modals/SupplierPaymentModal";
import SupplierHistoryModal from "./modals/SupplierHistoryModal";

// Native Thermal/A4 Print Templates
import PurchaseChalanPrint from "./print/PurchaseChalanPrint";
import SupplierVoucherPrint from "./print/SupplierVoucherPrint";

// Actions
import { deletePurchaseAction } from "@/app/actions/purchase-actions";
import {
  createSupplierAction,
  updateSupplierAction,
  deleteSupplierAction,
} from "@/app/actions/supplier-actions";
import { IPurchase } from "@/types/purchase";
import { ISupplier } from "@/types";
import { Input } from "@/components/common/ui/Input";
import SupplierModal from "./modals/SupplierModal";

interface PurchasesClientProps {
  purchases: IPurchase[];
  suppliers: ISupplier[];
  currencySymbol?: string;
  shopName?: string;
  userRole?: string;
}

export default function PurchasesClient({
  purchases = [],
  suppliers = [],
  currencySymbol = "৳",
  shopName = "Grocery Store",
  userRole = "OWNER",
}: PurchasesClientProps) {
  const [activeTab, setActiveTab] = useState<"invoices" | "suppliers" | "dues">("invoices");
  const [loading, setLoading] = useState(false);

  // Modal Targets
  const [viewInvoice, setViewInvoice] = useState<IPurchase | null>(null);
  const [deletePurchaseTarget, setDeletePurchaseTarget] = useState<IPurchase | null>(null);

  const [activeSupplierForPayment, setActiveSupplierForPayment] = useState<ISupplier | null>(null);
  const [activeSupplierForHistory, setActiveSupplierForHistory] = useState<ISupplier | null>(null);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<ISupplier | null>(null);
  const [deleteSupplierTarget, setDeleteSupplierTarget] = useState<ISupplier | null>(null);

  // Print Targets
  const [printChalan, setPrintChalan] = useState<IPurchase | null>(null);
  const [printVoucher, setPrintVoucher] = useState<any | null>(null);

const [printFormat, setPrintFormat] = useState<"80mm" | "58mm" | "a4">("80mm");

const handlePrintInvoice = (inv: IPurchase, format: "80mm" | "58mm" | "a4" = "80mm") => {
    setPrintVoucher(null); // 👈 Clear any existing voucher!
  setPrintFormat(format);
  setPrintChalan(inv);
  requestAnimationFrame(() => {
    setTimeout(() => window.print(), 80);
  });
};

const handlePrintVoucher = (details: any, format: "80mm" | "58mm" | "a4" = "80mm") => {
    setPrintChalan(null); // 👈 Clear any existing chalan!
  setPrintFormat(format);
  setPrintVoucher(details);
  requestAnimationFrame(() => {
    setTimeout(() => window.print(), 80);
  });
};

  // Delete Purchase Action (Owner Only)
  async function handleDeletePurchaseConfirm() {
    if (!deletePurchaseTarget) return;
    setLoading(true);
    const res = await deletePurchaseAction(deletePurchaseTarget.id);
    setLoading(false);
    if (res.success) {
      toast.success(`চালান #${deletePurchaseTarget.chalanNo} সফলভাবে মুছে ফেলা ও স্টক রোলব্যাক সম্পন্ন!`);
      setDeletePurchaseTarget(null);
    } else {
      toast.error(res.error || "চালান মুছে ফেলা সম্ভব হয়নি।");
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
      toast.success(editingSupplier ? "সাপ্লায়ার তথ্য আপডেট হয়েছে!" : "নতুন সরবরাহকারী সফলভাবে যুক্ত হয়েছে!");
      setSupplierModalOpen(false);
      setEditingSupplier(null);
    } else {
      toast.error(res.error || "অপারেশন ব্যর্থ হয়েছে।");
    }
  }

  // Delete Supplier Action (Owner Only)
  async function handleDeleteSupplierConfirm() {
    if (!deleteSupplierTarget) return;
    setLoading(true);
    const res = await deleteSupplierAction(deleteSupplierTarget.id);
    setLoading(false);
    if (res.success) {
      toast.success(`সরবরাহকারী "${deleteSupplierTarget.companyName || deleteSupplierTarget.name}" মুছে ফেলা হয়েছে।`);
      setDeleteSupplierTarget(null);
    } else {
      toast.error(res.error || "মুছে ফেলা সম্ভব হয়নি।");
    }
  }

  

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "ক্রয় ও সরবরাহকারী (Procurement)" }]} />

      {/* Primary Tabs Navigation Bar */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab("invoices")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${activeTab === "invoices"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200"
              }`}
          >
            <Receipt size={14} /> ক্রয় চালান সমূহ ({purchases.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("suppliers")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${activeTab === "suppliers"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200"
              }`}
          >
            <Truck size={14} /> সরবরাহকারী তালিকা ({suppliers.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("dues")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${activeTab === "dues"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200"
              }`}
          >
            <DollarSign size={14} /> মহাজনের দেনা (বাকির খাতা)
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {activeTab === "invoices" && (
            <Link
              href="/dashboard/admin/purchases/create"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition"
            >
              <PackagePlus size={16} /> নতুন ক্রয় চালান (New Stock-In)
            </Link>
          )}

          {activeTab === "suppliers" && (
            <button
              type="button"
              onClick={() => {
                setEditingSupplier(null);
                setSupplierModalOpen(true);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus size={16} /> নতুন সাপ্লায়ার যোগ
            </button>
          )}
        </div>
      </div>

      {/* 1. Invoices Tab */}
      {activeTab === "invoices" && (
        <InvoicesTab
          purchases={purchases}
          currencySymbol={currencySymbol}
          onView={(p) => setViewInvoice(p)}
          onPrint={handlePrintInvoice}
          onDelete={userRole === "OWNER" ? (p) => setDeletePurchaseTarget(p) : undefined}
        />
      )}

      {/* 2. Suppliers Directory Tab */}
      {activeTab === "suppliers" && (
        <SuppliersTab
          suppliers={suppliers}
          currencySymbol={currencySymbol}
          onEdit={(s) => {
            setEditingSupplier(s);
            setSupplierModalOpen(true);
          }}
          onDelete={userRole === "OWNER" ? (s) => setDeleteSupplierTarget(s) : undefined}
          onPay={(s) => setActiveSupplierForPayment(s)}
          onHistory={(s) => setActiveSupplierForHistory(s)}
        />
      )}

      {/* 3. Supplier Dues Ledger Tab */}
      {activeTab === "dues" && (
        <SupplierDuesTab
          suppliers={suppliers}
          currencySymbol={currencySymbol}
          onPay={(s) => setActiveSupplierForPayment(s)}
          onHistory={(s) => setActiveSupplierForHistory(s)}
        />
      )}

      {/* View Chalan Modal */}
      <ViewInvoiceModal
        invoice={viewInvoice}
        onClose={() => setViewInvoice(null)}
        onPrint={handlePrintInvoice}
        currencySymbol={currencySymbol}
      />

      {/* Pay Due Modal */}
      <SupplierPaymentModal
        supplier={activeSupplierForPayment}
        isOpen={Boolean(activeSupplierForPayment)}
        onClose={() => setActiveSupplierForPayment(null)}
        onSuccess={(payment) => handlePrintVoucher(payment)}
        currencySymbol={currencySymbol}
      />

      {/* Payment History Statement Modal */}
      <SupplierHistoryModal
        supplier={activeSupplierForHistory}
        isOpen={Boolean(activeSupplierForHistory)}
        onClose={() => setActiveSupplierForHistory(null)}
        onPrintVoucher={(p) =>
          handlePrintVoucher({
            voucherNo: p.voucherNo,
            supplierName: activeSupplierForHistory?.name || "",
            companyName: activeSupplierForHistory?.companyName || "",
            phone: activeSupplierForHistory?.phone || "",
            amountPaid: p.amount,
            previousDue: p.amount,
            remainingDue: 0,
            paymentMethod: p.paymentMethod,
            reference: p.reference,
            date: p.createdAt,
          })
        }
        currencySymbol={currencySymbol}
      />

      <SupplierModal
        isOpen={supplierModalOpen}
        onClose={() => {
          setSupplierModalOpen(false);
          setEditingSupplier(null);
        }}
        onSubmit={handleSupplierSubmit}
        editingSupplier={editingSupplier}
        loading={loading}
        currencySymbol={currencySymbol}
      />

      {/* Confirmation Dialog: Delete Purchase */}
      <ConfirmDialog
        isOpen={Boolean(deletePurchaseTarget)}
        onClose={() => setDeletePurchaseTarget(null)}
        onConfirm={handleDeletePurchaseConfirm}
        title="ক্রয় চালান বাতিল করুন (Rollback Chalan)"
        message={`আপনি কি নিশ্চিতভাবে চালান #${deletePurchaseTarget?.chalanNo} মুছে ফেলতে চান? এর ফলে মালামাল ব্রাঞ্চের স্টক থেকে হ্রাস পাবে এবং সাপ্লায়ার দেনা সমন্বয় করা হবে।`}
        confirmLabel="মুছে ফেলুন ও স্টক রোলব্যাক"
        loading={loading}
      />

      {/* Confirmation Dialog: Delete Supplier */}
      <ConfirmDialog
        isOpen={Boolean(deleteSupplierTarget)}
        onClose={() => setDeleteSupplierTarget(null)}
        onConfirm={handleDeleteSupplierConfirm}
        title="সাপ্লায়ার মুছে ফেলুন"
        message={`আপনি কি নিশ্চিতভাবে "${deleteSupplierTarget?.companyName || deleteSupplierTarget?.name}" মুছে ফেলতে চান?`}
        confirmLabel="সাপ্লায়ার মুছুন"
        loading={loading}
      />

      {/* Printable Thermal/A4 Templates (Rendered only during print) */}
      <PurchaseChalanPrint
        invoice={printChalan}
        shopName={shopName}
        currencySymbol={currencySymbol}
        format={printFormat}
      />
      <SupplierVoucherPrint
        details={printVoucher}
        shopName={shopName}
        currencySymbol={currencySymbol}
        format={printFormat}
      />
    </div>
  );
}