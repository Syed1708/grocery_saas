"use client";
"use no memo";

import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { MapPin, Phone, Users, ShieldCheck } from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";
import FormModal from "@/components/common/FormModal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { ModuleHeader } from "@/components/common/ModuleHeader";
import { TableActions } from "@/components/common/ui/table/TableHelpers";
import { useCrudModal } from "@/hooks/useCrudModal";

import { IBranchWithCounts } from "@/types/branch";
import { PERMISSIONS } from "@/types";
import { createBranchAction, deleteBranchAction, updateBranchAction } from "@/app/actions/branch-crud-actions";
import BranchForm from "./BranchForm";

interface Props {
  data: IBranchWithCounts[];
}

export default function BranchesClient({ data = [] }: Props) {
  // Universal CRUD state & mutation engine
  const crud = useCrudModal<IBranchWithCounts>({
    createAction: createBranchAction,
    updateAction: updateBranchAction,
    deleteAction: deleteBranchAction,
    entityName: "শাখা",
  });

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
              {row.original.status === "active" ? "সক্রিয়" : "নিষ্ক্রিয়"}
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
      cell: ({ row }) => (
        <TableActions
          onEdit={() => crud.openEdit(row.original)}
          editPermission={PERMISSIONS.BRANCH_MANAGE}
          onDelete={
            row.original.isMain
              ? undefined
              : () => crud.setDeleteTarget(row.original)
          }
          deletePermission={PERMISSIONS.BRANCH_MANAGE}
        />
      ),
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

      <ModuleHeader
        title="শাখা ও আউটলেট ব্যবস্থাপনা (Branches & Outlets)"
        subtitle="দোকানের বিভিন্ন আউটলেট, ওয়্যারহাউস এবং শাখাভিত্তিক কার্যক্রম নিয়ন্ত্রণ করুন"
        titleClassName="text-xl"
        onAdd={crud.openCreate}
        addLabel="নতুন শাখা যোগ"
        addPermission={PERMISSIONS.BRANCH_MANAGE}
      />

      <DataTable table={table} columns={columns} />

      {/* 🛡️ Key-reset prevents stale defaultValue React bug */}
      <FormModal
        key={crud.editingItem?.id || "new-branch-modal"}
        isOpen={crud.isOpen}
        onClose={crud.closeModal}
        onSubmit={crud.handleSubmit}
        title={crud.editingItem ? "শাখা তথ্য সম্পাদনা" : "নতুন শাখা / আউটলেট যুক্ত করুন"}
        description="শাখার নাম, কোড এবং যোগাযোগের ঠিকানা নির্ধারণ করুন।"
        isEditing={Boolean(crud.editingItem)}
        loading={crud.loading}
      >
        <BranchForm branch={crud.editingItem} errors={crud.errors} />
      </FormModal>

      <ConfirmDialog
        isOpen={Boolean(crud.deleteTarget)}
        onClose={() => crud.setDeleteTarget(null)}
        onConfirm={crud.handleDeleteConfirm}
        title="শাখা মুছে ফেলুন"
        message={`আপনি কি নিশ্চিতভাবে "${crud.deleteTarget?.name}" মুছে ফেলতে চান?`}
        confirmLabel="শাখা মুছুন"
        loading={crud.loading}
      />
    </div>
  );
}
