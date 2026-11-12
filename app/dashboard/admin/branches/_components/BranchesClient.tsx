"use client";
"use no memo";

import { useState } from "react";
import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Plus, Edit2, Trash2, MapPin, Phone, Users, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/common/data-table/DataTable";
import FormModal from "@/components/common/FormModal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import Breadcrumbs from "@/components/common/Breadcrumbs";

import { IBranchWithCounts } from "@/types/branch";
import { createBranchAction, deleteBranchAction, updateBranchAction } from "@/app/actions/branch-crud-actions";

interface Props {
  data: IBranchWithCounts[];
  userRole?: string;
}

export default function BranchesClient({ data = [], userRole = "OWNER" }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<IBranchWithCounts | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IBranchWithCounts | null>(null);
  const [loading, setLoading] = useState(false);

  const canManage = userRole === "OWNER" || userRole === "MANAGER";

  function openCreate() {
    setEditingBranch(null);
    setModalOpen(true);
  }

  function openEdit(branch: IBranchWithCounts) {
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
      toast.success(editingBranch ? "শাখার তথ্য আপডেট হয়েছে!" : "নতুন শাখা যুক্ত হয়েছে!");
      setModalOpen(false);
      setEditingBranch(null);
    } else {
      toast.error(res.error || "অপারেশন ব্যর্থ হয়েছে।");
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setLoading(true);

    const res = await deleteBranchAction(deleteTarget.id);
    setLoading(false);

    if (res.success) {
      toast.success(`শাখা "${deleteTarget.name}" মুছে ফেলা হয়েছে।`);
      setDeleteTarget(null);
    } else {
      toast.error(res.error || "মুছে ফেলা সম্ভব হয়নি।");
    }
  }

  const columns: ColumnDef<IBranchWithCounts>[] = [
    {
      accessorKey: "name",
      header: "শাখা / আউটলেট (Branch)",
      cell: ({ row }) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              {row.getValue("name")}
            </span>
            {row.original.isMain && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <ShieldCheck size={10} /> প্রধান শাখা
              </span>
            )}
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase ${
                row.original.status === "active"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400"
                  : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800"
              }`}
            >
              {row.original.status === "active" ? "সক্রিয়" : "নিষ্ক্রিয়"}
            </span>
          </div>
          <span className="font-mono text-[10px] text-neutral-400">কোড: [{row.original.code}]</span>
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "যোগাযোগ মোবাইল",
      cell: ({ row }) => (
        <span className="text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-1 font-mono">
          <Phone size={12} className="text-neutral-400" />
          {row.getValue("phone") || "—"}
        </span>
      ),
    },
    {
      accessorKey: "address",
      header: "ঠিকানা",
      cell: ({ row }) => (
        <span className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-xs flex items-center gap-1">
          <MapPin size={12} className="text-neutral-400 shrink-0" />
          {row.getValue("address") || "—"}
        </span>
      ),
    },
    {
      accessorKey: "_count.users",
      header: "নিযুক্ত স্টাফ",
      cell: ({ row }) => (
        <span className="text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-1 font-mono">
          <Users size={12} className="text-neutral-400" />
          {row.original._count?.users || 0} জন
        </span>
      ),
    },
    {
      id: "actions",
      header: "অ্যাকশন",
      cell: ({ row }) => {
        const branch = row.original;
        if (!canManage) return <span className="text-neutral-400 text-xs">—</span>;

        return (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => openEdit(branch)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="সম্পাদনা করুন"
            >
              <Edit2 size={15} />
            </button>
            {!branch.isMain && userRole === "OWNER" && (
              <button
                type="button"
                onClick={() => setDeleteTarget(branch)}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                title="শাখা মুছুন"
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
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "স্টোর সেটিংস" }, { label: "শাখা ও আউটলেট ব্যবস্থাপনা" }]} />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            শাখা ও আউটলেট ব্যবস্থাপনা (Branches & Outlets)
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            দোকানের বিভিন্ন আউটলেট, ওয়্যারহাউস এবং শাখাভিত্তিক কার্যক্রম নিয়ন্ত্রণ করুন
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus size={16} /> নতুন শাখা যোগ
          </button>
        )}
      </div>

      <DataTable table={table} columns={columns} />

      {/* 🛡️ Key-reset prevents stale defaultValue React bug */}
      <FormModal
        key={editingBranch?.id || "new-branch-modal"}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingBranch(null);
        }}
        onSubmit={handleBranchSubmit}
        title={editingBranch ? "শাখা তথ্য সম্পাদনা" : "নতুন শাখা / আউটলেট যুক্ত করুন"}
        description="শাখার নাম, কোড এবং যোগাযোগের ঠিকানা নির্ধারণ করুন।"
        isEditing={Boolean(editingBranch)}
        loading={loading}
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              শাখার নাম *
            </label>
            <input
              type="text"
              name="name"
              required
              defaultValue={editingBranch?.name || ""}
              placeholder="e.g. ধানমন্ডি আউটলেট"
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              শাখা কোড *
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
              যোগাযোগ মোবাইল
            </label>
            <input
              type="text"
              name="phone"
              defaultValue={editingBranch?.phone || ""}
              placeholder="017xxxxxxxx"
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              স্ট্যাটাস
            </label>
            <select
              name="status"
              defaultValue={editingBranch?.status || "active"}
              className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">সক্রিয় (Active)</option>
              <option value="inactive">নিষ্ক্রিয় (Inactive)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            শাখার ঠিকানা
          </label>
          <input
            type="text"
            name="address"
            defaultValue={editingBranch?.address || ""}
            placeholder="বাড়ি ১২, রোড ২৭, ধানমন্ডি, ঢাকা"
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
              প্রধান শাখা হিসেবে নির্ধারণ করুন (Principal Main Branch)
            </span>
          </label>
        </div>
      </FormModal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="শাখা মুছে ফেলুন"
        message={`আপনি কি নিশ্চিতভাবে "${deleteTarget?.name}" মুছে ফেলতে চান?`}
        confirmLabel="শাখা মুছুন"
        loading={loading}
      />
    </div>
  );
}