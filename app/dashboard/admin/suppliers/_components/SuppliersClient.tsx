"use client";

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
  Building2,
  Search,
  Globe,
  GitBranch,
} from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/common/data-table/DataTable";
import { DataTableViewOptions } from "@/components/common/data-table/DataTableViewOptions";
import FormModal from "@/components/common/FormModal";
import Modal from "@/components/common/Modal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
  createSupplierAction,
  updateSupplierAction,
  deleteSupplierAction,
  recordSupplierPaymentAction,
} from "@/app/actions/supplier-actions";
import { ISupplier } from "@/types";

export default function SuppliersClient({
  data,
  currencySymbol = "৳",
}: {
  data: ISupplier[];
  currencySymbol?: string;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<ISupplier | null>(null);
  const [activeSupplierForPayment, setActiveSupplierForPayment] = useState<ISupplier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ISupplier | null>(null);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [columnVisibility, setColumnVisibility] = useState({});

  const filteredData = useMemo(() => {
    return data.filter((s) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesCompany = s.companyName?.toLowerCase().includes(q);
        const matchesContact = s.name.toLowerCase().includes(q);
        const matchesPhone = s.phone.toLowerCase().includes(q);
        if (!matchesCompany && !matchesContact && !matchesPhone) return false;
      }
      return true;
    });
  }, [data, searchQuery]);

  function openCreate() {
    setEditingSupplier(null);
    setModalOpen(true);
  }

  function openEdit(supplier: ISupplier) {
    setEditingSupplier(supplier);
    setModalOpen(true);
  }

  function openPaymentModal(supplier: ISupplier) {
    setActiveSupplierForPayment(supplier);
    setPaymentModalOpen(true);
  }

  async function handleSupplierSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    if (editingSupplier) {
      formData.append("id", editingSupplier.id);
    }

    const res = editingSupplier
      ? await updateSupplierAction(formData)
      : await createSupplierAction(formData);

    setLoading(false);

    if (res.success) {
      toast.success(
        editingSupplier
          ? "Supplier profile updated!"
          : "Supplier registered successfully!"
      );
      setModalOpen(false);
    } else {
      toast.error(res.error || "Operation failed.");
    }
  }

  async function handlePaymentSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeSupplierForPayment) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get("amount")?.toString() || "0");
    const paymentMethod = formData.get("paymentMethod")?.toString() || "cash";

    const res = await recordSupplierPaymentAction(activeSupplierForPayment.id, amount, paymentMethod);
    setLoading(false);

    if (res.success) {
      toast.success(`Payment of ${currencySymbol}${amount} recorded successfully!`);
      setPaymentModalOpen(false);
    } else {
      toast.error(res.error || "Failed to record payment.");
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setLoading(true);

    const res = await deleteSupplierAction(deleteTarget.id);
    setLoading(false);

    if (res.success) {
      toast.success(`Supplier "${deleteTarget.companyName}" deleted.`);
      setDeleteTarget(null);
    } else {
      toast.error(res.error || "Failed to delete.");
    }
  }

  const columns: ColumnDef<ISupplier>[] = [
    {
      accessorKey: "companyName",
      header: "Distributor / Company",
      cell: ({ row }) => {
        const isGlobal = !row.original.branchId;
        const branchName = row.original.branch?.name || row.original.branchName;

        return (
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <Building2 size={13} className="text-neutral-400" />
                {row.original.companyName || row.original.name}
              </span>
              
              {/* 👈 Visual Branch Scope Badge */}
              {isGlobal ? (
                <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                  <Globe size={10} /> Global (সকল শাখা)
                </span>
              ) : (
                <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                  <GitBranch size={10} /> {branchName || "Local"}
                </span>
              )}
            </div>

            <span className="text-[11px] text-neutral-400 block mt-0.5">
              Contact: {row.original.contactPerson || row.original.name}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <span className="text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-1 font-mono">
          <Phone size={11} className="text-neutral-400" />
          {row.getValue("phone")}
        </span>
      ),
    },
    {
      accessorKey: "currentDue",
      header: "Payable Debt (দোকানের দেনা)",
      cell: ({ row }) => {
        // Safe access for currentDue or payableBalance
        const debt = Number(row.original.currentDue ?? (row.original as any).payableBalance ?? 0);
        const hasDebt = debt > 0;

        return (
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 text-xs font-mono font-bold rounded-lg ${
                hasDebt
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
              }`}
            >
              {currencySymbol}{debt.toFixed(2)} {hasDebt ? "Owed" : "Cleared"}
            </span>
            {hasDebt && (
              <button
                type="button"
                onClick={() => openPaymentModal(row.original)}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                + Pay
              </button>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const supplier = row.original;
        return (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => openEdit(supplier)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="Edit Profile"
            >
              <Edit2 size={14} />
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(supplier)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            Suppliers &amp; Distributors (মহাজন ও ডিস্ট্রিবিউটর)
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Manage product vendors, corporate distributors, and payable accounts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DataTableViewOptions table={table} />
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus size={16} /> Add Supplier
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 rounded-2xl shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company, contact, or phone..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-neutral-900 dark:text-neutral-100"
          />
        </div>
      </div>

      <DataTable table={table} columns={columns} />

      {/* Supplier Form Modal */}
      <FormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSupplierSubmit}
        title={editingSupplier ? "Edit Supplier" : "Register New Supplier"}
        description="Add company and contact details for stock inward purchases."
        isEditing={Boolean(editingSupplier)}
        loading={loading}
        maxWidth="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Distributor / Company Name *
            </label>
            <input
              type="text"
              name="companyName"
              required
              defaultValue={editingSupplier?.companyName || ""}
              placeholder="e.g. Unilever Bangladesh Ltd."
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Contact Person / SR Name *
            </label>
            <input
              type="text"
              name="name"
              required
              defaultValue={editingSupplier?.name || ""}
              placeholder="e.g. Tariqul Islam (SR)"
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Phone Number *
            </label>
            <input
              type="text"
              name="phone"
              required
              defaultValue={editingSupplier?.phone || ""}
              placeholder="01700000000"
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {!editingSupplier && (
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Opening Debt Owed ({currencySymbol})
              </label>
              <input
                type="number"
                step="0.01"
                name="openingBalance"
                defaultValue={0}
                placeholder="0.00"
                className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Address / Office Location
          </label>
          <input
            type="text"
            name="addressLine"
            defaultValue={editingSupplier?.address || ""}
            placeholder="Warehouse #14, Tejgaon Industrial Area..."
            className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 👈 Multi-Branch Scope Toggle */}
        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              name="isGlobal"
              value="true"
              defaultChecked={editingSupplier ? !editingSupplier.branchId : false}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer"
            />
            <div>
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">
                সকল শাখার জন্য প্রযোজ্য (Global Corporate Supplier)
              </span>
              <span className="text-[10px] text-neutral-400 block">
                Enable for major brands (Unilever, Pran) so all branches can purchase from this vendor
              </span>
            </div>
          </label>
        </div>
      </FormModal>

      {/* Pay Supplier Modal */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Pay Supplier Balance"
        description={`Record store payout to ${activeSupplierForPayment?.companyName || activeSupplierForPayment?.name}.`}
        maxWidth="sm"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 flex justify-between items-center text-xs">
            <span className="text-neutral-500 dark:text-neutral-400">Total Owed Debt:</span>
            <span className="font-bold font-mono text-amber-600 dark:text-amber-400">
              {currencySymbol}{Number(activeSupplierForPayment?.currentDue ?? (activeSupplierForPayment as any)?.payableBalance ?? 0).toFixed(2)}
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Amount Paid ({currencySymbol}) *
            </label>
            <input
              type="number"
              step="0.01"
              name="amount"
              required
              max={Number(activeSupplierForPayment?.currentDue ?? (activeSupplierForPayment as any)?.payableBalance ?? 0) || undefined}
              defaultValue={Number(activeSupplierForPayment?.currentDue ?? (activeSupplierForPayment as any)?.payableBalance ?? 0) || ""}
              placeholder="0.00"
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          {/* 👈 Payment Method Selector for Day-End Z-Report integration */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Payment Method (টাকা পরিশোধের মাধ্যম) *
            </label>
            <select
              name="paymentMethod"
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none cursor-pointer"
            >
              <option value="cash">নগদ ক্যাশ ড্রয়ার (Cash Drawer)</option>
              <option value="bank">ব্যাংক ট্রান্সফার (Bank Transfer)</option>
              <option value="bkash">বিকাশ (bKash)</option>
              <option value="nagad">নগদ (Nagad)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setPaymentModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Recording..." : "Confirm Payment"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Supplier Profile"
        message={`Are you sure you want to delete "${deleteTarget?.companyName || deleteTarget?.name}"?`}
        confirmLabel="Delete Supplier"
        loading={loading}
      />
    </div>
  );
}