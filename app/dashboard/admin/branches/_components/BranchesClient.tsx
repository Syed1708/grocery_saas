"use client";
"use no memo";

import { useState } from "react";
import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Plus, Edit2, Trash2, GitBranch, MapPin, Phone, Users } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/common/data-table/DataTable";
import FormModal from "@/components/common/FormModal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import {
  createBranchAction,
  updateBranchAction,
  deleteBranchAction,
} from "@/app/actions/branch-crud-actions";
import { IBranch } from "@/types";

interface BranchWithCounts extends IBranch {
  _count: { users: number; sales: number };
}

export default function BranchesClient({ data }: { data: BranchWithCounts[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchWithCounts | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BranchWithCounts | null>(null);
  const [loading, setLoading] = useState(false);

  function openCreate() {
    setEditingBranch(null);
    setModalOpen(true);
  }

  function openEdit(branch: BranchWithCounts) {
    setEditingBranch(branch);
    setModalOpen(true);
  }

  async function handleBranchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    if (editingBranch) {
      formData.append("id", editingBranch.id);
    }

    const res = editingBranch
      ? await updateBranchAction(formData)
      : await createBranchAction(formData);

    setLoading(false);

    if (res.success) {
      toast.success(
        editingBranch ? "Branch updated successfully!" : "Branch created successfully!"
      );
      setModalOpen(false);
    } else {
      toast.error(res.error || "Operation failed.");
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setLoading(true);

    const res = await deleteBranchAction(deleteTarget.id);
    setLoading(false);

    if (res.success) {
      toast.success(`Branch "${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
    } else {
      toast.error(res.error || "Failed to delete branch.");
    }
  }

  const columns: ColumnDef<BranchWithCounts>[] = [
    {
      accessorKey: "name",
      header: "Branch / Outlet",
      cell: ({ row }) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              {row.getValue("name")}
            </span>
            {row.original.isMain && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                Main
              </span>
            )}
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                row.original.status === "active"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                  : "bg-neutral-100 text-neutral-500"
              }`}
            >
              {row.original.status}
            </span>
          </div>
          <span className="font-mono text-[10px] text-neutral-400">
            Code: [{row.original.code}]
          </span>
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Contact Phone",
      cell: ({ row }) => (
        <span className="text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
          <Phone size={12} className="text-neutral-400" />
          {row.getValue("phone") || "—"}
        </span>
      ),
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ row }) => (
        <span className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-xs block flex items-center gap-1">
          <MapPin size={12} className="text-neutral-400 shrink-0" />
          {row.getValue("address") || "—"}
        </span>
      ),
    },
    {
      accessorKey: "_count.users",
      header: "Assigned Staff",
      cell: ({ row }) => (
        <span className="text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
          <Users size={12} className="text-neutral-400" />
          {row.original._count.users} staff
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const branch = row.original;
        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => openEdit(branch)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="Edit"
            >
              <Edit2 size={15} />
            </button>
            {!branch.isMain && (
              <button
                onClick={() => setDeleteTarget(branch)}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                title="Delete"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: "Store Settings" }, { label: "Branches & Outlets" }]} />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            Branches & Outlets (শাখা ব্যবস্থাপনা)
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Configure retail outlet locations, warehouses, and branch-specific inventory
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
        >
          <Plus size={16} /> Add Outlet
        </button>
      </div>

      <DataTable table={table} columns={columns} />

      <FormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleBranchSubmit}
        title={editingBranch ? "Edit Branch" : "Add New Branch / Outlet"}
        description="Configure branch identity, code, and address."
        isEditing={Boolean(editingBranch)}
        loading={loading}
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Branch Name *
            </label>
            <input
              type="text"
              name="name"
              required
              defaultValue={editingBranch?.name || ""}
              placeholder="e.g. Dhanmondi Outlet"
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Branch Code *
            </label>
            <input
              type="text"
              name="code"
              required
              defaultValue={editingBranch?.code || ""}
              placeholder="e.g. DHN-01"
              className="w-full px-3 py-2 text-xs font-mono uppercase border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Contact Phone
            </label>
            <input
              type="text"
              name="phone"
              defaultValue={editingBranch?.phone || ""}
              placeholder="01700000000"
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Status
            </label>
            <select
              name="status"
              defaultValue={editingBranch?.status || "active"}
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Physical Address
          </label>
          <input
            type="text"
            name="address"
            defaultValue={editingBranch?.address || ""}
            placeholder="Road 27, House 12, Dhanmondi, Dhaka"
            className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="pt-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              name="isMain"
              value="true"
              defaultChecked={editingBranch?.isMain || false}
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
            />
            <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Set as Principal Main Branch (প্রধান শাখা)
            </span>
          </label>
        </div>
      </FormModal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Outlet"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete Branch"
        loading={loading}
      />
    </div>
  );
}