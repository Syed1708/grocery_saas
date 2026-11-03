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
import { IPurchase } from "@/types/purchase";
import { ISupplier } from "@/types";
import { Input } from "@/components/common/ui/Input";

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

  // Delete Purchase Action (Owner Only)
  async function handleDeletePurchaseConfirm() {
    if (!deletePurchaseTarget) return;
    setLoading(true);
    const res = await deletePurchaseAction(deletePurchaseTarget.id);
    setLoading(false);
    if (res.success) {
      toast.success(`চালান #${deletePurchaseTarget.chalanNo} মুছে ফেলা ও স্টক সমন্বয় সম্পন্ন!`);
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
      toast.success(editingSupplier ? "সাপ্লায়ার তথ্য আপডেট হয়েছে!" : "নতুন সাপ্লায়ার যোগ হয়েছে!");
      setSupplierModalOpen(false);
      setEditingSupplier(null);
    } else {
      toast.error(res.error || "অপারেশন ব্যর্থ হয়েছে।");
    }
  }

  // Delete Supplier Action
  async function handleDeleteSupplierConfirm() {
    if (!deleteSupplierTarget) return;
    setLoading(true);
    const res = await deleteSupplierAction(deleteSupplierTarget.id);
    setLoading(false);
    if (res.success) {
      toast.success(`সাপ্লায়ার "${deleteSupplierTarget.companyName}" মুছে ফেলা হয়েছে।`);
      setDeleteSupplierTarget(null);
    } else {
      toast.error(res.error || "মুছে ফেলা ব্যর্থ হয়েছে।");
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "ক্রয় ও সরবরাহকারী (Procurement)" }]} />

      {/* Primary Tabs Bar */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab("invoices")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeTab === "invoices"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200"
            }`}
          >
            <Receipt size={14} /> ক্রয় চালান সমূহ ({purchases.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("suppliers")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeTab === "suppliers"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200"
            }`}
          >
            <Truck size={14} /> সরবরাহকারী তালিকা ({suppliers.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("dues")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeTab === "dues"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200"
            }`}
          >
            <DollarSign size={14} /> সাপ্লায়ার দেনা (বাকির খাতা)
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {activeTab === "invoices" && (
            <Link
              href="/dashboard/admin/purchases/create"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition"
            >
              <PackagePlus size={16} /> নতুন ক্রয় চালান (New Bill)
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
              <Plus size={16} /> সাপ্লায়ার যোগ করুন
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
          onDelete={userRole === "OWNER" ? (p) => setDeletePurchaseTarget(p) : undefined}
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
          onDelete={userRole === "OWNER" ? (s) => setDeleteSupplierTarget(s) : undefined}
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
              supplierName: activeSupplierForHistory?.name || "",
              companyName: activeSupplierForHistory?.companyName || "",
              phone: activeSupplierForHistory?.phone || "",
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

      {/* 👈 Clean FormModal using our generic Input primitives */}
      <FormModal
        isOpen={supplierModalOpen}
        onClose={() => {
          setSupplierModalOpen(false);
          setEditingSupplier(null);
        }}
        onSubmit={handleSupplierSubmit}
        title={editingSupplier ? "সাপ্লায়ার তথ্য সম্পাদনা" : "নতুন সরবরাহকারী (সাপ্লায়ার) যোগ"}
        description="স্টক সরবরাহকারী প্রতিষ্ঠান ও বিক্রয় প্রতিনিধির বিবরণ লিখুন।"
        isEditing={Boolean(editingSupplier)}
        loading={loading}
        submitLabel={editingSupplier ? "আপডেট করুন" : "যোগ করুন"}
        maxWidth="md"
      >
        <div className="space-y-4">
          <Input
            label="কোম্পানি / ডিস্ট্রিবিউটর নাম *"
            name="companyName"
            required
            defaultValue={editingSupplier?.companyName || ""}
            placeholder="যেমন: প্রাণ ফুডস লিমিটেড"
          />
          <Input
            label="যোগাযোগকারী ব্যক্তি (SR) *"
            name="name"
            required
            defaultValue={editingSupplier?.name || ""}
            placeholder="যেমন: মোঃ রফিকুল ইসলাম"
          />
          <Input
            label="মোবাইল নম্বর *"
            name="phone"
            required
            defaultValue={editingSupplier?.phone || ""}
            placeholder="017xxxxxxxx"
          />
        </div>
      </FormModal>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={Boolean(deletePurchaseTarget)}
        onClose={() => setDeletePurchaseTarget(null)}
        onConfirm={handleDeletePurchaseConfirm}
        title="ক্রয় চালান বাতিল করুন (Rollback Chalan)"
        message={`আপনি কি নিশ্চিতভাবে চালান #${deletePurchaseTarget?.chalanNo} মুছে ফেলতে চান? এর ফলে মালামাল ব্রাঞ্চের স্টক থেকে হ্রাস পাবে এবং সাপ্লায়ার দেনা সমন্বয় করা হবে।`}
        confirmLabel="মুছে ফেলুন ও স্টক রোলব্যাক"
        loading={loading}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteSupplierTarget)}
        onClose={() => setDeleteSupplierTarget(null)}
        onConfirm={handleDeleteSupplierConfirm}
        title="সাপ্লায়ার মুছে ফেলুন"
        message={`আপনি কি নিশ্চিতভাবে "${deleteSupplierTarget?.companyName}" মুছে ফেলতে চান?`}
        confirmLabel="সাপ্লায়ার মুছুন"
        loading={loading}
      />
    </div>
  );
}