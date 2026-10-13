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
  X,
  UserCheck,
  UserX,
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

type BalanceFilter = "ALL" | "HAS_DUES" | "SETTLED" | "PERMANENT" | "WALK_IN";

export default function CustomersClient({
  data,
  currencySymbol = "$",
}: {
  data: ICustomer[];
  currencySymbol?: string;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<ICustomer | null>(null);
  const [activeCustomerForPayment, setActiveCustomerForPayment] = useState<ICustomer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ICustomer | null>(null);
  const [loading, setLoading] = useState(false);

  // Super Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [balanceFilter, setBalanceFilter] = useState<BalanceFilter>("ALL");
  const [columnVisibility, setColumnVisibility] = useState({});

  // Super Search Filter Engine (Searches Name, Phone, Village, and District)
  const filteredData = useMemo(() => {
    return data.filter((c) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(query);
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
          ? "Customer profile updated!"
          : "Customer registered successfully!"
      );
      setModalOpen(false);
    } else {
      toast.error(res.error || "Operation failed.");
    }
  }

  async function handlePaymentSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeCustomerForPayment) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get("amount")?.toString() || "0");

    const res = await recordCustomerPaymentAction(activeCustomerForPayment.id, amount);
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

    const res = await deleteCustomerAction(deleteTarget.id);
    setLoading(false);

    if (res.success) {
      toast.success(`Customer "${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
    } else {
      toast.error(res.error || "Failed to delete customer.");
    }
  }

  const columns: ColumnDef<ICustomer>[] = [
    {
      accessorKey: "name",
      header: "Customer",
      enableHiding: false,
      cell: ({ row }) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              {row.getValue("name")}
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                row.original.type === "PERMANENT"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                  : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
              }`}
            >
              {row.original.type === "PERMANENT" ? "Permanent" : "Walk-in"}
            </span>
          </div>
          {row.original.phone && (
            <span className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
              <Phone size={10} /> {row.original.phone}
            </span>
          )}
        </div>
      ),
    },
    {
      id: "demographics",
      header: "Village & District",
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
      header: "Credit Limit",
      cell: ({ row }) => (
        <span className="text-neutral-500 dark:text-neutral-400">
          {currencySymbol}{Number(row.getValue("creditLimit")).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: "currentBalance",
      header: "Khata Balance",
      cell: ({ row }) => {
        const balance = Number(row.original.currentBalance);
        const hasDues = balance > 0;

        return (
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 text-xs font-bold rounded-lg ${
                hasDues
                  ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
              }`}
            >
              {currencySymbol}{balance.toFixed(2)} {hasDues ? "Owed" : "Clear"}
            </span>
            {hasDues && (
              <button
                onClick={() => openPaymentModal(row.original)}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                + Receive Pay
              </button>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => openEdit(customer)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="Edit Profile"
            >
              <Edit2 size={15} />
            </button>
            <button
              onClick={() => setDeleteTarget(customer)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="Delete"
            >
              <Trash2 size={15} />
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
      {/* Top Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            Customers & Khata Ledger
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Track permanent contractor balances, village demographics, and credit limits
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DataTableViewOptions table={table} />
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus size={16} /> Add Customer
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
            placeholder="Super Search by Name, Mobile Phone, Village, or District..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-neutral-900 dark:text-neutral-100"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1 shrink-0 mr-1">
            <Filter size={12} /> Filter By:
          </span>
          {[
            { label: "All Customers", value: "ALL" },
            { label: "Has Outstanding Dues", value: "HAS_DUES" },
            { label: "Settled / No Dues", value: "SETTLED" },
            { label: "Permanent Only", value: "PERMANENT" },
            { label: "Walk-in Only", value: "WALK_IN" },
          ].map((pill) => {
            const isActive = balanceFilter === pill.value;
            return (
              <button
                key={pill.value}
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

      {/* Modular DataTable */}
      <DataTable table={table} columns={columns} />

      {/* Customer Form Modal */}
      <FormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCustomerSubmit}
        title={editingCustomer ? "Edit Customer Profile" : "Register New Customer"}
        description="Add contractor or regular customer profile with credit limit and address."
        isEditing={Boolean(editingCustomer)}
        loading={loading}
        maxWidth="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Customer Full Name *
            </label>
            <input
              type="text"
              name="name"
              required
              defaultValue={editingCustomer?.name || ""}
              placeholder="e.g. Master Contractor, Aminul Islam"
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Mobile Phone
            </label>
            <input
              type="text"
              name="phone"
              defaultValue={editingCustomer?.phone || ""}
              placeholder="01700000000"
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Customer Type
            </label>
            <select
              name="type"
              defaultValue={editingCustomer?.type || "PERMANENT"}
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="PERMANENT">Permanent (Credit Ledger)</option>
              <option value="WALK_IN">Walk-in (Cash/Retail Only)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Village / Area
            </label>
            <input
              type="text"
              name="village"
              defaultValue={editingCustomer?.village || ""}
              placeholder="e.g. Rampur, Sector 4"
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              District
            </label>
            <input
              type="text"
              name="district"
              defaultValue={editingCustomer?.district || ""}
              placeholder="e.g. Comilla, Dhaka"
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Credit Limit ({currencySymbol})
            </label>
            <input
              type="number"
              step="0.01"
              name="creditLimit"
              defaultValue={editingCustomer?.creditLimit ?? 500}
              placeholder="500.00"
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {!editingCustomer && (
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Opening Balance Due ({currencySymbol})
              </label>
              <input
                type="number"
                step="0.01"
                name="openingBalance"
                defaultValue={0}
                placeholder="0.00"
                className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[10px] text-neutral-400">If customer already owes past debt</span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Address Line / Notes
          </label>
          <input
            type="text"
            name="addressLine"
            defaultValue={editingCustomer?.addressLine || ""}
            placeholder="Shop #3, Beside Central Mosque..."
            className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </FormModal>

      {/* Quick Receive Payment Modal */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Receive Khata Payment"
        description={`Record repayment from ${activeCustomerForPayment?.name}.`}
        maxWidth="sm"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 flex justify-between items-center text-xs">
            <span className="text-neutral-500 dark:text-neutral-400">Current Owed Debt:</span>
            <span className="font-bold text-red-600 dark:text-red-400">
              {currencySymbol}{activeCustomerForPayment?.currentBalance.toFixed(2)}
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Payment Amount Received ({currencySymbol}) *
            </label>
            <input
              type="number"
              step="0.01"
              name="amount"
              required
              max={activeCustomerForPayment?.currentBalance || undefined}
              defaultValue={activeCustomerForPayment?.currentBalance || ""}
              placeholder="0.00"
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Customer Profile"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete Customer"
        loading={loading}
      />
    </div>
  );
}