"use client";

import FormModal from "@/components/common/FormModal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { FormField } from "@/components/common/ui/form/FormField";
import { IBranchSettings } from "@/types/settings";
import { createBranchAction, updateBranchAction, deleteBranchAction } from "@/app/actions/branch-crud-actions";
import { useCrudModal } from "@/hooks/useCrudModal";
import { GitBranch, Plus, Edit2, Trash2, Phone, MapPin, Users, ShoppingBag } from "lucide-react";

export default function BranchManagementTab({ branches }: { branches: IBranchSettings[] }) {
  // Same CRUD engine + actions as the dedicated Branches module
  const crud = useCrudModal<IBranchSettings>({
    createAction: createBranchAction,
    updateAction: updateBranchAction,
    deleteAction: deleteBranchAction,
    entityName: "শাখা",
  });

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
          onClick={crud.openCreate}
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
                  onClick={() => crud.openEdit(b)}
                  className="p-1.5 rounded-lg text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                  title="Edit"
                >
                  <Edit2 size={13} />
                </button>
                {!b.isMain && (
                  <button
                    type="button"
                    onClick={() => crud.setDeleteTarget(b)}
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
        key={crud.editingItem?.id || "new-branch-modal"}
        isOpen={crud.isOpen}
        onClose={crud.closeModal}
        onSubmit={crud.handleSubmit}
        title={crud.editingItem ? `শাখা সম্পাদনা: ${crud.editingItem.name}` : "নতুন শাখা যুক্ত করুন"}
        description="Configure branch identity, unique code, contact details, and main outlet status."
        isEditing={Boolean(crud.editingItem)}
        loading={crud.loading}
        submitLabel={crud.editingItem ? "আপডেট সংরক্ষণ করুন" : "শাখা তৈরি করুন"}
        maxWidth="md"
      >
        <div className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <FormField
              type="text"
              label="শাখার নাম (Branch Name)"
              name="name"
              required
              defaultValue={crud.editingItem?.name || ""}
              placeholder="e.g. কাওরান বাজার ব্রাঞ্চ"
              error={crud.errors.name}
            />
            <FormField
              type="text"
              label="শাখা কোড (Code)"
              name="code"
              required
              defaultValue={crud.editingItem?.code || ""}
              placeholder="e.g. KB-01"
              className="font-mono uppercase"
              error={crud.errors.code}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              type="text"
              label="মোবাইল নম্বর"
              name="phone"
              defaultValue={crud.editingItem?.phone || ""}
              placeholder="01700000000"
              error={crud.errors.phone}
            />
            <FormField
              type="email"
              label="ইমেইল (Optional)"
              name="email"
              defaultValue={crud.editingItem?.email || ""}
              error={crud.errors.email}
            />
          </div>

          <FormField
            type="text"
            label="শারীরিক ঠিকানা (Address)"
            name="address"
            defaultValue={crud.editingItem?.address || ""}
            placeholder="দোকান নং ১২, রোড নং ৫..."
            error={crud.errors.address}
          />

          <FormField
            type="select"
            label="শাখার অবস্থা (Status)"
            name="status"
            defaultValue={crud.editingItem?.status || "active"}
            options={[
              { label: "সচল (Active)", value: "active" },
              { label: "স্থগিত (Inactive)", value: "inactive" },
            ]}
            error={crud.errors.status}
          />

          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <FormField
              type="checkbox"
              label="প্রধান শাখা নির্ধারণ করুন (Set as Principal Main Branch)"
              name="isMain"
              defaultValue={crud.editingItem?.isMain || false}
              error={crud.errors.isMain}
            />
          </div>
        </div>
      </FormModal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(crud.deleteTarget)}
        onClose={() => crud.setDeleteTarget(null)}
        onConfirm={crud.handleDeleteConfirm}
        title="শাখা মুছে ফেলা (Delete Outlet)"
        message={`আপনি কি নিশ্চিত যে "${crud.deleteTarget?.name}" শাখাটি মুছে ফেলতে চান?`}
        confirmLabel="শাখা ডিলিট করুন"
        loading={crud.loading}
      />
    </div>
  );
}
