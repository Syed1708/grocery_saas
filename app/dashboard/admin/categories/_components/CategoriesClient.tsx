"use client";

import { useState } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Plus, Search, Tag } from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";
import { DataTableViewOptions } from "@/components/common/data-table/DataTableViewOptions";
import FormModal from "@/components/common/FormModal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { PermissionGate } from "@/components/common/PermissionGate";
import { useCrudModal } from "@/hooks/useCrudModal";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "@/app/actions/category-actions";
import { ICategory, PERMISSIONS } from "@/types";
import { StatusBadge, TableActions, TableImage } from "@/components/common/ui/table/TableHelpers";
import CategoryForm from "./CategoryForm";

interface Props {
  data: ICategory[];
  userRole?: string;
}

export default function CategoriesClient({ data = [], userRole = "OWNER" }: Props) {
  "use no memo";

  // Universal CRUD state & mutation engine
  const crud = useCrudModal<ICategory>({
    createAction: createCategoryAction,
    updateAction: updateCategoryAction,
    deleteAction: deleteCategoryAction,
    entityName: "ক্যাটাগরি",
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState({});

  const columns: ColumnDef<ICategory>[] = [
    {
      accessorKey: "image",
      header: "ছবি",
      enableHiding: false,
      cell: ({ row }) => (
        <TableImage src={row.original.image} fallbackIcon={<Tag size={16} />} />
      ),
    },
    {
      accessorKey: "name",
      header: "ক্যাটাগরির নাম",
      cell: ({ row }) => (
        <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">
          {row.getValue("name")}
        </span>
      ),
    },
    {
      accessorKey: "description",
      header: "বিবরণ",
      cell: ({ row }) => (
        <span className="text-neutral-500 dark:text-neutral-400 truncate max-w-xs block text-xs">
          {row.getValue("description") || "—"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "স্ট্যাটাস",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "অ্যাকশন",
      enableHiding: false,
      cell: ({ row }) => (
        <TableActions
          onEdit={() => crud.openEdit(row.original)}
          canEdit={true}
          editPermission={PERMISSIONS.CATALOG_MANAGE}
          onDelete={() => crud.setDeleteTarget(row.original)}
          canDelete={userRole === "OWNER"}
          deletePermission={PERMISSIONS.CATALOG_MANAGE}
        />
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, columnVisibility },
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "ক্যাটালগ ও ইনভেন্টরি" }, { label: "পণ্য ক্যাটাগরি" }]} />

      {/* Top Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            পণ্য ক্যাটাগরি (Product Categories)
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            পিওএস স্ক্রিনে দ্রুত পণ্য খুঁজে পেতে ক্যাটাগরি ও ছবি নির্ধারণ করুন
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DataTableViewOptions table={table} />
          <PermissionGate permission={PERMISSIONS.CATALOG_MANAGE}>
            <button
              type="button"
              onClick={crud.openCreate}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus size={16} /> নতুন ক্যাটাগরি যোগ
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Matching Search Bar */}
      <div className="flex items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 rounded-2xl shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 text-neutral-400" size={15} />
          <input
            type="text"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="ক্যাটাগরির নাম দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-neutral-900 dark:text-neutral-100"
          />
        </div>
      </div>

      <DataTable table={table} columns={columns} />

      {/* 🛡️ Key-reset prevents stale input bug */}
      {/* Inside FormModal in CategoriesClient.tsx: */}
      <FormModal
        key={crud.editingItem?.id || "new-category-modal"}
        isOpen={crud.isOpen}
        onClose={crud.closeModal}
        onSubmit={crud.handleSubmit}
        title={crud.editingItem ? "ক্যাটাগরি সম্পাদনা" : "নতুন ক্যাটাগরি তৈরি"}
        description="ক্যাটাগরির নাম, ছবি ও বিবরণ নির্ধারণ করুন।"
        isEditing={Boolean(crud.editingItem)}
        loading={crud.loading}
      >
        <CategoryForm
          category={crud.editingItem}
          errors={crud.errors} // 👈 FIXED: Passes live validation errors to form!
        />
      </FormModal>

      <ConfirmDialog
        isOpen={Boolean(crud.deleteTarget)}
        onClose={() => crud.setDeleteTarget(null)}
        onConfirm={crud.handleDeleteConfirm}
        title="ক্যাটাগরি মুছে ফেলুন"
        message={`আপনি কি নিশ্চিতভাবে "${crud.deleteTarget?.name}" মুছে ফেলতে চান?`}
        confirmLabel="ক্যাটাগরি মুছুন"
        loading={crud.loading}
      />
    </div>
  );
}