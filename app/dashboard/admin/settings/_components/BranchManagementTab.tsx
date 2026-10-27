"use client";

import { useState } from "react";
import FormModal from "@/components/common/FormModal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Input } from "@/components/common/ui/Input";
import { IBranchSettings } from "@/types/settings";
import { upsertBranchAction, deleteBranchAction } from "@/app/actions/settings-actions";
import { toast } from "sonner";
import { GitBranch, Plus, Edit2, Trash2, Phone, MapPin, Users, ShoppingBag } from "lucide-react";

export default function BranchManagementTab({ branches }: { branches: IBranchSettings[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<IBranchSettings | null>(null);
  const [editingBranch, setEditingBranch] = useState<IBranchSettings | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    code: "",
    phone: "",
    email: "",
    address: "",
    isMain: false,
    status: "active" as "active" | "inactive",
  });

  const handleOpenAdd = () => {
    setEditingBranch(null);
    setForm({
      name: "",
      code: "",
      phone: "",
      email: "",
      address: "",
      isMain: branches.length === 0, // First branch defaults to main
      status: "active",
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (b: IBranchSettings) => {
    setEditingBranch(b);
    setForm({
      name: b.name,
      code: b.code,
      phone: b.phone || "",
      email: b.email || "",
      address: b.address || "",
      isMain: b.isMain,
      status: (b.status as "active" | "inactive") || "active",
    });
    setModalOpen(true);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      id: editingBranch?.id,
      ...form,
    };

    const res = await upsertBranchAction(payload);
    setLoading(false);

    if (res.success) {
      toast.success(editingBranch ? "Branch updated successfully!" : "New branch created!");
      setModalOpen(false);
    } else {
      toast.error(res.error || "Failed to save branch.");
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setLoading(true);
    const res = await deleteBranchAction(deleteTarget.id);
    setLoading(false);

    if (res.success) {
      toast.success(`Branch "${deleteTarget.name}" deleted successfully.`);
      setDeleteTarget(null);
    } else {
      toast.error(res.error || "Failed to delete branch.");
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center pb-3 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <GitBranch size={18} className="text-blue-600" />
          <div>
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              ব্রাঞ্চ ও আউটলেটসমূহ (Branches & Outlets)
            </h2>
            <p className="text-xs text-neutral-500">Configure retail outlet locations, warehouses, and branch inventory</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition cursor-pointer"
        >
          <Plus size={14} /> নতুন শাখা যোগ করুন
        </button>
      </div>

      {/* Branch Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {branches.map((b) => (
          <div
            key={b.id}
            className={`p-4 rounded-xl border bg-white dark:bg-neutral-900 shadow-xs space-y-3 transition ${
              b.isMain
                ? "border-blue-400 dark:border-blue-800 ring-1 ring-blue-500/20"
                : "border-neutral-200 dark:border-neutral-800"
            }`}
          >
            {/* Top Bar */}
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs text-neutral-900 dark:text-neutral-100">{b.name}</h3>
                  {b.isMain && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      প্রধান শাখা (Main)
                    </span>
                  )}
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                      b.status === "active"
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-neutral-400">কোড: [{b.code}]</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(b)}
                  className="p-1.5 rounded-lg text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                  title="Edit"
                >
                  <Edit2 size={13} />
                </button>
                {!b.isMain && (
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(b)}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Address & Contact */}
            <div className="text-[11px] text-neutral-500 space-y-1">
              <span className="flex items-center gap-1.5 truncate">
                <Phone size={12} className="text-neutral-400 shrink-0" />
                {b.phone || "ফোন নম্বর দেওয়া হয়নি"}
              </span>
              <span className="flex items-center gap-1.5 truncate">
                <MapPin size={12} className="text-neutral-400 shrink-0" />
                {b.address || "ঠিকানা দেওয়া হয়নি"}
              </span>
            </div>

            {/* Counts Ribbon */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-400">
              <span className="flex items-center gap-1">
                <Users size={12} className="text-neutral-400" />
                {b._count?.users || 0} জন স্টাফ
              </span>
              <span className="flex items-center gap-1">
                <ShoppingBag size={12} className="text-neutral-400" />
                {b._count?.sales || 0} টি বিক্রয়
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Form Modal */}
      <FormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingBranch ? `শাখা সম্পাদনা: ${editingBranch.name}` : "নতুন শাখা যুক্ত করুন"}
        description="Configure branch identity, unique code, contact details, and main outlet status."
        loading={loading}
        submitLabel={editingBranch ? "আপডেট সংরক্ষণ করুন" : "শাখা তৈরি করুন"}
        maxWidth="md"
      >
        <div className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="শাখার নাম (Branch Name) *"
              required
              placeholder="e.g. কাওরান বাজার ব্রাঞ্চ"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="শাখা কোড (Code) *"
              required
              placeholder="e.g. KB-01"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="মোবাইল নম্বর"
              placeholder="01700000000"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              label="ইমেইল (Optional)"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <Input
            label="শারীরিক ঠিকানা (Address)"
            placeholder="দোকান নং ১২, রোড নং ৫..."
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              শাখার অবস্থা (Status)
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })}
              className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 outline-none"
            >
              <option value="active">সচল (Active)</option>
              <option value="inactive">স্থগিত (Inactive)</option>
            </select>
          </div>

          {/* 👈 The Missing isMain Checkbox */}
          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.isMain}
                onChange={(e) => setForm({ ...form, isMain: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block">
                  প্রধান প্রধান শাখা নির্ধারণ করুন (Set as Principal Main Branch)
                </span>
                <span className="text-[10px] text-neutral-400 block">
                  Primary outlet for store registration and central inventory
                </span>
              </div>
            </label>
          </div>
        </div>
      </FormModal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="শাখা মুছে ফেলা (Delete Outlet)"
        message={`আপনি কি নিশ্চিত যে "${deleteTarget?.name}" শাখাটি মুছে ফেলতে চান?`}
        confirmLabel="শাখা ডিলিট করুন"
        loading={loading}
      />
    </div>
  );
}