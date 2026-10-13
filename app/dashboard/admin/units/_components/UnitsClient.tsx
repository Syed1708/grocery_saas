"use client";
"use no memo";

import { useState } from "react";
import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Plus, Trash2, Scale } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/common/data-table/DataTable";
import Modal from "@/components/common/Modal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { createUnitAction, deleteUnitAction } from "@/app/actions/unit-actions";

interface UnitData {
  id: string;
  name: string;
  code: string;
  _count: { products: number };
}

export default function UnitsClient({ data }: { data: UnitData[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UnitData | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const res = await createUnitAction(formData);

    setLoading(false);
    if (res.success) {
      toast.success("Unit created successfully!");
      setModalOpen(false);
    } else {
      toast.error(res.error || "Failed to create unit.");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setLoading(true);

    const res = await deleteUnitAction(deleteTarget.id);
    setLoading(false);

    if (res.success) {
      toast.success(`Unit "${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
    } else {
      toast.error(res.error || "Failed to delete.");
    }
  }

  const columns: ColumnDef<UnitData>[] = [
    {
      accessorKey: "name",
      header: "Unit Name",
      cell: ({ row }) => (
        <span className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <Scale size={14} className="text-neutral-400" />
          {row.getValue("name")}
        </span>
      ),
    },
    {
      accessorKey: "code",
      header: "Unit Symbol / Code",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold uppercase bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md border border-neutral-200 dark:border-neutral-700">
          {row.getValue("code")}
        </span>
      ),
    },
    {
      accessorKey: "_count.products",
      header: "Used in Products",
      cell: ({ row }) => (
        <span className="text-neutral-500 dark:text-neutral-400">
          {row.original._count.products} products
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <button
          onClick={() => setDeleteTarget(row.original)}
          disabled={row.original._count.products > 0}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 disabled:opacity-30 disabled:pointer-events-none hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          title={
            row.original._count.products > 0
              ? "Cannot delete unit in use"
              : "Delete Unit"
          }
        >
          <Trash2 size={15} />
        </button>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            Units of Measurement
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Manage measurement units and bulk packaging conversions
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
        >
          <Plus size={16} /> Add Unit
        </button>
      </div>

      <DataTable table={table} columns={columns} />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Measurement Unit"
        description="Create standard or packaging units (e.g. Carton, Sachet, Tin, Bundle)."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Unit Name *
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g. Carton, Sachet, Tin"
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Short Code / Symbol *
            </label>
            <input
              type="text"
              name="code"
              required
              placeholder="e.g. ctn, sch, tin"
              className="w-full px-3 py-2 text-xs font-mono uppercase border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Saving..." : "Create Unit"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Unit"
        message={`Are you sure you want to delete unit "${deleteTarget?.name}"?`}
        confirmLabel="Delete Unit"
        loading={loading}
      />
    </div>
  );
}