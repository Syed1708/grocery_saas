// app/(dashboard)/customers/_components/CustomersClient.tsx
"use client";
"use no memo";

import { useState, useMemo } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Phone,
  MapPin,
  DollarSign,
  Users,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { ModuleHeader } from "@/components/common/ModuleHeader";
import { SearchFilterBar } from "@/components/common/SearchFilterBar";
import { toast } from "sonner";
import { DataTable } from "@/components/common/data-table/DataTable";
import { DataTableViewOptions } from "@/components/common/data-table/DataTableViewOptions";
import FormModal from "@/components/common/FormModal";
import Modal from "@/components/common/Modal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { TableActions } from "@/components/common/ui/table/TableHelpers";
import { useCrudModal } from "@/hooks/useCrudModal";
import {
  createCustomerAction,
  updateCustomerAction,
  deleteCustomerAction,
  recordCustomerPaymentAction,
} from "@/app/actions/customer-actions";
import { ICustomer, PERMISSIONS } from "@/types";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/payment-methods";
import CustomerForm from "./CustomerForm";

type BalanceFilter = "ALL" | "HAS_DUES" | "SETTLED" | "PERMANENT" | "WALK_IN";

export default function CustomersClient({
  data = [],
  currencySymbol = "৳",
  userRole = "OWNER",
}: {
  data: ICustomer[];
  currencySymbol?: string;
  userRole?: string;
}) {
  // Universal CRUD state & mutation engine
  const crud = useCrudModal<ICustomer>({
    createAction: createCustomerAction,
    updateAction: updateCustomerAction,
    deleteAction: deleteCustomerAction,
    entityName: "কাস্টমার",
  });

  // Payment modal (one-off custom action)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [activeCustomerForPayment, setActiveCustomerForPayment] = useState<ICustomer | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [balanceFilter, setBalanceFilter] = useState<BalanceFilter>("ALL");
  const [columnVisibility, setColumnVisibility] = useState({});

  // Summary KPI Calculations
  const totalDues = useMemo(() => {
    return data.reduce((sum, c) => sum + (c.currentBalance > 0 ? c.currentBalance : 0), 0);
  }, [data]);

  const debtorsCount = useMemo(() => {
    return data.filter((c) => c.currentBalance > 0).length;
  }, [data]);

  const totalCreditLimit = useMemo(() => {
    return data.reduce((sum, c) => sum + Number(c.creditLimit || 0), 0);
  }, [data]);

  // Crash-Proof Super Search Engine
  const filteredData = useMemo(() => {
    return data.filter((c) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = c.name?.toLowerCase().includes(query) || false;
        const matchesPhone = c.phone?.toLowerCase().includes(query) || false;
        const matchesVillage = c.village?.toLowerCase().includes(query) || false;
        const matchesDistrict = c.district?.toLowerCase().includes(query) || false;
        if (!matchesName && !matchesPhone && !matchesVillage && !matchesDistrict) return false;
      }

      if (balanceFilter === "HAS_DUES" && c.currentBalance <= 0) return false;
      if (balanceFilter === "SETTLED" && c.currentBalance > 0) return false;
      if (balanceFilter === "PERMANENT" && c.type !== "PERMANENT") return false;
      if (balanceFilter === "WALK_IN" && c.type !== "WALK_IN") return false;

      return true;
    });
  }, [data, searchQuery, balanceFilter]);

  function openPaymentModal(customer: ICustomer) {
    setActiveCustomerForPayment(customer);
    setPaymentModalOpen(true);
  }

  // 👈 Hardened with Payment Method & Account Sync
  async function handlePaymentSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeCustomerForPayment) return;

    setPaymentLoading(true);
    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get("amount")?.toString() || "0");
    const paymentMethod = formData.get("paymentMethod")?.toString() || "cash";
    const note = formData.get("note")?.toString() || undefined;

    const res = await recordCustomerPaymentAction(
      activeCustomerForPayment.id,
      amount,
      paymentMethod,
      note
    );
    setPaymentLoading(false);

    if (res.success) {
      toast.success(`বকেয়া আদায় সম্পন্ন: ${currencySymbol}${amount.toFixed(2)} (রসিদ #${res.receiptNo})`);
      setPaymentModalOpen(false);
    } else {
      toast.error(res.error || "পেমেন্ট রেকর্ড করা সম্ভব হয়নি।");
    }
  }

  const columns: ColumnDef<ICustomer>[] = [
    {
      accessorKey: "name",
      header: "কাস্টমার",
      enableHiding: false,
      cell: ({ row }) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-900 dark:text-neutral-100 text-xs">
              {row.getValue("name")}
            </span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                row.original.type === "PERMANENT"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                  : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
              }`}
            >
              {row.original.type === "PERMANENT" ? "স্থায়ী (খাতা)" : "খুচরা"}
            </span>
          </div>
          {row.original.phone && (
            <span className="text-[11px] text-neutral-400 font-mono flex items-center gap-1 mt-0.5">
              <Phone size={10} /> {row.original.phone}
            </span>
          )}
        </div>
      ),
    },
    {
      id: "demographics",
      header: "এলাকা ও জেলা",
      cell: ({ row }) => {
        const { village, district } = row.original;
        if (!village && !district) return <span className="text-neutral-400">—</span>;
        return (
          <span className="text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
            <MapPin size={12} className="text-neutral-400 shrink-0" />
            {[village, district].filter(Boolean).join(", ")}
          </span>
        );
      },
    },
    {
      accessorKey: "creditLimit",
      header: "বাকি লিমিট",
      cell: ({ row }) => (
        <span className="text-neutral-600 dark:text-neutral-400 font-mono text-xs">
          {currencySymbol}{Number(row.getValue("creditLimit")).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: "currentBalance",
      header: "খাতা ব্যালেন্স (বকেয়া পাওনা)",
      cell: ({ row }) => {
        const balance = Number(row.original.currentBalance);
        const hasDues = balance > 0;

        return (
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 text-xs font-bold rounded-lg font-mono ${
                hasDues
                  ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
              }`}
            >
              {currencySymbol}{balance.toFixed(2)} {hasDues ? "বাকি" : "পরিশোধিত"}
            </span>
            {hasDues && (
              <button
                type="button"
                onClick={() => openPaymentModal(row.original)}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer flex items-center gap-0.5"
              >
                <DollarSign size={11} /> আদায়
              </button>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "অ্যাকশন",
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <TableActions
            onEdit={() => crud.openEdit(row.original)}
            editPermission={PERMISSIONS.POS_ACCESS}
            onDelete={() => crud.setDeleteTarget(row.original)}
            canDelete={userRole === "OWNER"}
            deletePermission={PERMISSIONS.POS_ACCESS}
          />
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "গ্রাহক ও বাকির খাতা (Khata Ledger)" }]} />

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="মোট বাকির খাতা পাওনা"
          value={`${currencySymbol}${totalDues.toLocaleString()}`}
          subtitle="মার্কেটে অনাদায়ী মোট বাকি"
          icon={AlertCircle}
          tone="rose"
        />
        <StatCard
          title="বাকিদার কাস্টমার সংখ্যা"
          value={`${debtorsCount} জন`}
          subtitle="যাদের বর্তমানে বকেয়া আছে"
          icon={Users}
          tone="neutral"
        />
        <StatCard
          title="অনুমোদিত ক্রেডিট লিমিট"
          value={`${currencySymbol}${totalCreditLimit.toLocaleString()}`}
          subtitle="সর্বমোট অনুমোদিত বাকির সীমা"
          tone="info"
        />
        <StatCard
          title="মোট নিবন্ধিত কাস্টমার"
          value={`${data.length} জন`}
          subtitle="স্থায়ী ও নিয়মিত খাতা গ্রাহক"
          icon={CheckCircle2}
          tone="emerald"
        />
      </div>

      {/* Header with Title and Add Button */}
      <ModuleHeader
        title="কাস্টমার তালিকা ও বাকির খাতা"
        subtitle="স্থায়ী গ্রাহকদের বাকির খাতা, এলাকা ভিত্তিক তথ্য ও ক্রেডিট লিমিট পরিচালনা করুন"
        actions={<DataTableViewOptions table={table} />}
        onAdd={crud.openCreate}
        addLabel="নতুন কাস্টমার যোগ"
      />

      {/* Super Search & Filter Toolbar */}
      <SearchFilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="নাম, মোবাইল নম্বর, গ্রাম বা জেলা দিয়ে দ্রুত খুঁজুন..."
        filters={[
          { label: "সকল কাস্টমার", value: "ALL" },
          { label: "বকেয়া আছে (Has Dues)", value: "HAS_DUES" },
          { label: "পরিশোধিত (Clear)", value: "SETTLED" },
          { label: "স্থায়ী খাতা (Permanent)", value: "PERMANENT" },
          { label: "খুচরা ক্রেতা (Walk-in)", value: "WALK_IN" },
        ]}
        activeFilter={balanceFilter}
        onFilterChange={(value) => setBalanceFilter(value as BalanceFilter)}
      />

      <DataTable table={table} columns={columns} />

      {/* Customer Create/Edit Form Modal */}
      <FormModal
        key={crud.editingItem?.id || "new-customer-modal"}
        isOpen={crud.isOpen}
        onClose={crud.closeModal}
        onSubmit={crud.handleSubmit}
        title={crud.editingItem ? "কাস্টমার প্রোফাইল সম্পাদনা" : "নতুন কাস্টমার নিবন্ধন"}
        description="বাকির খাতা ও লেনদেনের জন্য কাস্টমারের নাম, ফোন ও লিমিট লিখুন।"
        isEditing={Boolean(crud.editingItem)}
        loading={crud.loading}
        submitLabel={crud.editingItem ? "আপডেট করুন" : "যোগ করুন"}
        maxWidth="lg"
      >
        <CustomerForm
          customer={crud.editingItem}
          currencySymbol={currencySymbol}
          errors={crud.errors}
        />
      </FormModal>

      {/* 👈 Hardened Receive Due Payment Modal with Method Selection */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="কাস্টমার বকেয়া আদায় (Receive Due Payment)"
        description={`গ্রাহক: ${activeCustomerForPayment?.name} (${activeCustomerForPayment?.phone || "ফোন নেই"})`}
        maxWidth="sm"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex justify-between items-center">
            <span className="text-neutral-500">বর্তমান বকেয়া দেনা:</span>
            <span className="font-black text-rose-600 font-mono text-base">
              {currencySymbol}{activeCustomerForPayment?.currentBalance.toFixed(2)}
            </span>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
              আদায়ের পরিমাণ ({currencySymbol}) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              name="amount"
              required
              max={activeCustomerForPayment?.currentBalance || undefined}
              defaultValue={activeCustomerForPayment?.currentBalance || ""}
              placeholder="0.00"
              className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-neutral-800 font-mono font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 👈 Added: Payment Method Destination */}
          <div>
            <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
              টাকা জমার মাধ্যম (Payment Account) *
            </label>
            <select
              name="paymentMethod"
              defaultValue="cash"
              className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-neutral-800 outline-none cursor-pointer font-medium"
            >
              {PAYMENT_METHOD_OPTIONS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
              নোট বা মানি রিসিট রেফারেন্স
            </label>
            <input
              type="text"
              name="note"
              placeholder="যেমন: খাতা রসিদ নং ১২০"
              className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-neutral-800 outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t dark:border-neutral-800">
            <button
              type="button"
              onClick={() => setPaymentModalOpen(false)}
              className="px-4 py-2 border rounded-xl font-semibold hover:bg-neutral-50 cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={paymentLoading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              {paymentLoading ? "জমা হচ্ছে..." : "পেমেন্ট নিশ্চিত করুন"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(crud.deleteTarget)}
        onClose={() => crud.setDeleteTarget(null)}
        onConfirm={crud.handleDeleteConfirm}
        title="কাস্টমার মুছে ফেলুন"
        message={`আপনি কি নিশ্চিতভাবে "${crud.deleteTarget?.name}" এর প্রোফাইল মুছে ফেলতে চান? যদি কাস্টমারের কোনো বকেয়া বা পূর্বের চালান থাকে, তবে তাকে মুছে ফেলা যাবে না।`}
        confirmLabel="কাস্টমার মুছুন"
        loading={crud.loading}
      />
    </div>
  );
}
