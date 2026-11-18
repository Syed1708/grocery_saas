"use client";

import { useState, useMemo } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Phone, Building2, Globe, GitBranch } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/common/data-table/DataTable";
import { DataTableViewOptions } from "@/components/common/data-table/DataTableViewOptions";
import FormModal from "@/components/common/FormModal";
import Modal from "@/components/common/Modal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { ModuleHeader } from "@/components/common/ModuleHeader";
import { SearchFilterBar } from "@/components/common/SearchFilterBar";
import { TableActions } from "@/components/common/ui/table/TableHelpers";
import { useCrudModal } from "@/hooks/useCrudModal";
import {
  createSupplierAction,
  updateSupplierAction,
  deleteSupplierAction,
  recordSupplierPaymentAction,
} from "@/app/actions/supplier-actions";
import { ISupplier, PERMISSIONS } from "@/types";
import SupplierForm from "./SupplierForm";

export default function SuppliersClient({
  data,
  currencySymbol = "৳",
}: {
  data: ISupplier[];
  currencySymbol?: string;
}) {
  // Universal CRUD state & mutation engine
  const crud = useCrudModal<ISupplier>({
    createAction: createSupplierAction,
    updateAction: updateSupplierAction,
    deleteAction: deleteSupplierAction,
    entityName: "সাপ্লায়ার",
  });

  // Payment modal (one-off custom action)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [activeSupplierForPayment, setActiveSupplierForPayment] = useState<ISupplier | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

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

  function openPaymentModal(supplier: ISupplier) {
    setActiveSupplierForPayment(supplier);
    setPaymentModalOpen(true);
  }

  async function handlePaymentSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeSupplierForPayment) return;

    setPaymentLoading(true);
    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get("amount")?.toString() || "0");
    const paymentMethod = formData.get("paymentMethod")?.toString() || "cash";

    const res = await recordSupplierPaymentAction(activeSupplierForPayment.id, amount, paymentMethod);
    setPaymentLoading(false);

    if (res.success) {
      toast.success(`Payment of ${currencySymbol}${amount} recorded successfully!`);
      setPaymentModalOpen(false);
    } else {
      toast.error(res.error || "Failed to record payment.");
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
        const debt = Number(row.original.currentDue ?? 0);
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
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <TableActions
            onEdit={() => crud.openEdit(row.original)}
            editPermission={PERMISSIONS.CATALOG_MANAGE}
            onDelete={() => crud.setDeleteTarget(row.original)}
            deletePermission={PERMISSIONS.CATALOG_MANAGE}
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
    <div className="space-y-4">
      <ModuleHeader
        title="Suppliers & Distributors (মহাজন ও ডিস্ট্রিবিউটর)"
        subtitle="Manage product vendors, corporate distributors, and payable accounts"
        actions={<DataTableViewOptions table={table} />}
        onAdd={crud.openCreate}
        addLabel="Add Supplier"
        addPermission={PERMISSIONS.CATALOG_MANAGE}
      />

      <SearchFilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search company, contact, or phone..."
      />

      <DataTable table={table} columns={columns} />

      {/* Supplier Form Modal */}
      <FormModal
        key={crud.editingItem?.id || "new-supplier-modal"}
        isOpen={crud.isOpen}
        onClose={crud.closeModal}
        onSubmit={crud.handleSubmit}
        title={crud.editingItem ? "Edit Supplier" : "Register New Supplier"}
        description="Add company and contact details for stock inward purchases."
        isEditing={Boolean(crud.editingItem)}
        loading={crud.loading}
        maxWidth="lg"
      >
        <SupplierForm
          supplier={crud.editingItem}
          currencySymbol={currencySymbol}
          errors={crud.errors}
        />
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
              {currencySymbol}{Number(activeSupplierForPayment?.currentDue ?? 0).toFixed(2)}
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
              max={Number(activeSupplierForPayment?.currentDue ?? 0) || undefined}
              defaultValue={Number(activeSupplierForPayment?.currentDue ?? 0) || ""}
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
              disabled={paymentLoading}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50 cursor-pointer"
            >
              {paymentLoading ? "Recording..." : "Confirm Payment"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(crud.deleteTarget)}
        onClose={() => crud.setDeleteTarget(null)}
        onConfirm={crud.handleDeleteConfirm}
        title="Delete Supplier Profile"
        message={`Are you sure you want to delete "${crud.deleteTarget?.companyName || crud.deleteTarget?.name}"?`}
        confirmLabel="Delete Supplier"
        loading={crud.loading}
      />
    </div>
  );
}
