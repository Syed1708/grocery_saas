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
  Plus,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  DollarSign,
  Search,
  Filter,
  Users,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/common/data-table/DataTable";
import { DataTableViewOptions } from "@/components/common/data-table/DataTableViewOptions";
import FormModal from "@/components/common/FormModal";
import Modal from "@/components/common/Modal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
  createCustomerAction,
  updateCustomerAction,
  deleteCustomerAction,
  recordCustomerPaymentAction,
} from "@/app/actions/customer-actions";
import { ICustomer } from "@/types";
import Breadcrumbs from "@/components/common/Breadcrumbs";

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
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<ICustomer | null>(null);
  const [activeCustomerForPayment, setActiveCustomerForPayment] = useState<ICustomer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ICustomer | null>(null);
  const [loading, setLoading] = useState(false);

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

  function openCreate() {
    setEditingCustomer(null);
    setModalOpen(true);
  }

  function openEdit(customer: ICustomer) {
    setEditingCustomer(customer);
    setModalOpen(true);
  }

  function openPaymentModal(customer: ICustomer) {
    setActiveCustomerForPayment(customer);
    setPaymentModalOpen(true);
  }

  async function handleCustomerSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    if (editingCustomer) {
      formData.append("id", editingCustomer.id);
    }

    const res = editingCustomer
      ? await updateCustomerAction(formData)
      : await createCustomerAction(formData);

    setLoading(false);

    if (res.success) {
      toast.success(
        editingCustomer
          ? "কাস্টমার প্রোফাইল আপডেট করা হয়েছে!"
          : "নতুন কাস্টমার সফলভাবে যুক্ত হয়েছে!"
      );
      setModalOpen(false);
    } else {
      toast.error(res.error || "অপারেশন ব্যর্থ হয়েছে।");
    }
  }

  // 👈 Hardened with Payment Method & Account Sync
  async function handlePaymentSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeCustomerForPayment) return;

    setLoading(true);
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
    setLoading(false);

    if (res.success) {
      toast.success(`বকেয়া আদায় সম্পন্ন: ${currencySymbol}${amount.toFixed(2)} (রসিদ #${res.receiptNo})`);
      setPaymentModalOpen(false);
    } else {
      toast.error(res.error || "পেমেন্ট রেকর্ড করা সম্ভব হয়নি।");
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setLoading(true);

    const res = await deleteCustomerAction(deleteTarget.id);
    setLoading(false);

    if (res.success) {
      toast.success(`কাস্টমার "${deleteTarget.name}" মুছে ফেলা হয়েছে।`);
      setDeleteTarget(null);
    } else {
      toast.error(res.error || "কাস্টমার মুছে ফেলা সম্ভব হয়নি।");
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
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => openEdit(customer)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="প্রোফাইল সম্পাদনা"
            >
              <Edit2 size={14} />
            </button>
            {/* 🛡️ OWNER-ONLY DELETION GUARD */}
            {userRole === "OWNER" && (
              <button
                type="button"
                onClick={() => setDeleteTarget(customer)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                title="মুছে ফেলুন"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        );
      },
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
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500  mb-1 flex items-center gap-1">
            <AlertCircle size={13} /> মোট বাকির খাতা পাওনা
          </span>
          <span className="text-2xl font-black text-rose-600 font-mono">
            {currencySymbol}{totalDues.toLocaleString()}
          </span>
          <span className="text-[11px] text-neutral-400 block mt-1">মার্কেটে অনাদায়ী মোট বাকি</span>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400  mb-1 flex items-center gap-1">
            <Users size={13} /> বাকিদার কাস্টমার সংখ্যা
          </span>
          <span className="text-2xl font-black text-neutral-900 dark:text-neutral-100 font-mono">
            {debtorsCount} জন
          </span>
          <span className="text-[11px] text-neutral-400 block mt-1">যাদের বর্তমানে বকেয়া আছে</span>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
            অনুমোদিত ক্রেডিট লিমিট
          </span>
          <span className="text-2xl font-black text-blue-600 font-mono">
            {currencySymbol}{totalCreditLimit.toLocaleString()}
          </span>
          <span className="text-[11px] text-neutral-400 block mt-1">সর্বমোট অনুমোদিত বাকির সীমা</span>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500 mb-1 flex items-center gap-1">
            <CheckCircle2 size={13} /> মোট নিবন্ধিত কাস্টমার
          </span>
          <span className="text-2xl font-black text-emerald-600 font-mono">
            {data.length} জন
          </span>
          <span className="text-[11px] text-neutral-400 block mt-1">স্থায়ী ও নিয়মিত খাতা গ্রাহক</span>
        </div>
      </div>

      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            কাস্টমার তালিকা ও বাকির খাতা
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            স্থায়ী গ্রাহকদের বাকির খাতা, এলাকা ভিত্তিক তথ্য ও ক্রেডিট লিমিট পরিচালনা করুন
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DataTableViewOptions table={table} />
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus size={16} /> নতুন কাস্টমার যোগ
          </button>
        </div>
      </div>

      {/* Super Search & Filter Toolbar */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl space-y-3 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="নাম, মোবাইল নম্বর, গ্রাম বা জেলা দিয়ে দ্রুত খুঁজুন..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-neutral-900 dark:text-neutral-100 font-medium"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1 shrink-0 mr-1">
            <Filter size={12} /> ফিল্টার:
          </span>
          {[
            { label: "সকল কাস্টমার", value: "ALL" },
            { label: "বকেয়া আছে (Has Dues)", value: "HAS_DUES" },
            { label: "পরিশোধিত (Clear)", value: "SETTLED" },
            { label: "স্থায়ী খাতা (Permanent)", value: "PERMANENT" },
            { label: "খুচরা ক্রেতা (Walk-in)", value: "WALK_IN" },
          ].map((pill) => {
            const isActive = balanceFilter === pill.value;
            return (
              <button
                key={pill.value}
                type="button"
                onClick={() => setBalanceFilter(pill.value as BalanceFilter)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white font-semibold shadow-xs"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      <DataTable table={table} columns={columns} />

      {/* Customer Create/Edit Form Modal */}
      <FormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCustomerSubmit}
        title={editingCustomer ? "কাস্টমার প্রোফাইল সম্পাদনা" : "নতুন কাস্টমার নিবন্ধন"}
        description="বাকির খাতা ও লেনদেনের জন্য কাস্টমারের নাম, ফোন ও লিমিট লিখুন।"
        isEditing={Boolean(editingCustomer)}
        loading={loading}
        submitLabel={editingCustomer ? "আপডেট করুন" : "যোগ করুন"}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                কাস্টমারের পূর্ণ নাম *
              </label>
              <input
                type="text"
                name="name"
                required
                defaultValue={editingCustomer?.name || ""}
                placeholder="যেমন: হাজী মোশাররফ হোসেন"
                className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                মোবাইল নম্বর
              </label>
              <input
                type="text"
                name="phone"
                defaultValue={editingCustomer?.phone || ""}
                placeholder="017xxxxxxxx"
                className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                কাস্টমার টাইপ
              </label>
              <select
                name="type"
                defaultValue={editingCustomer?.type || "PERMANENT"}
                className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="PERMANENT">স্থায়ী খাতা (Credit Ledger)</option>
                <option value="WALK_IN">খুচরা ক্রেতা (Cash Only)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                গ্রাম বা এলাকা
              </label>
              <input
                type="text"
                name="village"
                defaultValue={editingCustomer?.village || ""}
                placeholder="যেমন: মোল্লাপাড়া, রোড-২"
                className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                জেলা
              </label>
              <input
                type="text"
                name="district"
                defaultValue={editingCustomer?.district || ""}
                placeholder="যেমন: ঢাকা"
                className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                বাকি লিমিট ({currencySymbol})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="creditLimit"
                defaultValue={editingCustomer?.creditLimit ?? 5000}
                placeholder="5000.00"
                className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            {!editingCustomer && (
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  পূর্বের বকেয়া ব্যালেন্স ({currencySymbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="openingBalance"
                  defaultValue={0}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <span className="text-[10px] text-neutral-400">খাতার পূর্বে কোনো বাকি থাকলে লিখুন</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              ঠিকানা বা নোট
            </label>
            <input
              type="text"
              name="addressLine"
              defaultValue={editingCustomer?.addressLine || editingCustomer?.address || ""}
              placeholder="দোকান নং ৫, বাজার রোড..."
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </FormModal>

      {/* 👈 Hardened Receive Due Payment Modal with Method Selection */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="কাস্টমার বকেয়া আদায় (Receive Due Payment)"
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
              আদায়ের পরিমাণ ({currencySymbol}) *
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
              <option value="cash">প্রধান ক্যাশ ড্রয়ার (Cash Drawer)</option>
              <option value="bkash">বিকাশ মার্চেন্ট ওয়ালেট (bKash)</option>
              <option value="nagad">নগদ মার্চেন্ট ওয়ালেট (Nagad)</option>
              <option value="bank">ব্যাংক একাউন্ট (Bank Deposit)</option>
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
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              {loading ? "জমা হচ্ছে..." : "পেমেন্ট নিশ্চিত করুন"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="কাস্টমার মুছে ফেলুন"
        message={`আপনি কি নিশ্চিতভাবে "${deleteTarget?.name}" এর প্রোফাইল মুছে ফেলতে চান? যদি কাস্টমারের কোনো বকেয়া বা পূর্বের চালান থাকে, তবে তাকে মুছে ফেলা যাবে না।`}
        confirmLabel="কাস্টমার মুছুন"
        loading={loading}
      />
    </div>
  );
}