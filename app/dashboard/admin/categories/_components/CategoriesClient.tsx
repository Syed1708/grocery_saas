"use client";
"use no memo";

import { useState } from "react";
import Image from "next/image";
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Plus, Edit2, Trash2, Search, Tag } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/common/data-table/DataTable";
import { DataTableViewOptions } from "@/components/common/data-table/DataTableViewOptions";
import FormModal from "@/components/common/FormModal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { PermissionGate } from "@/components/common/PermissionGate";
import CategoryForm from "./CategoryForm";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "@/app/actions/category-actions";
import { ICategory, PERMISSIONS } from "@/types";

interface Props {
  data: ICategory[];
  userRole?: string;
}

export default function CategoriesClient({ data = [], userRole = "OWNER" }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ICategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ICategory | null>(null);
  const [loading, setLoading] = useState(false);

  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState({});

  function openCreate() {
    setEditingCategory(null);
    setModalOpen(true);
  }

  function openEdit(category: ICategory) {
    setEditingCategory(category);
    setModalOpen(true);
  }

  async function handleFormSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    if (editingCategory) {
      formData.append("id", editingCategory.id);
    }

    const res = editingCategory
      ? await updateCategoryAction(formData)
      : await createCategoryAction(formData);

    setLoading(false);

    if (res.success) {
      toast.success(
        editingCategory ? "ক্যাটাগরি আপডেট সম্পন্ন হয়েছে!" : "নতুন ক্যাটাগরি তৈরি হয়েছে!"
      );
      setModalOpen(false);
      setEditingCategory(null);
    } else {
      toast.error(res.error || "অপারেশন ব্যর্থ হয়েছে।");
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setLoading(true);

    const res = await deleteCategoryAction(deleteTarget.id);
    setLoading(false);

    if (res.success) {
      toast.success(`"${deleteTarget.name}" ক্যাটাগরি সফলভাবে মুছে ফেলা হয়েছে!`);
      setDeleteTarget(null);
    } else {
      toast.error(res.error || "মুছে ফেলা সম্ভব হয়নি।");
    }
  }

  const columns: ColumnDef<ICategory>[] = [
    {
      accessorKey: "image",
      header: "ছবি",
      enableHiding: false,
      cell: ({ row }) => {
        const image = row.getValue("image") as string | null;
        return (
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shrink-0">
            {image ? (
              <Image
                src={image}
                alt="Category"
                width={40}
                height={40}
                sizes="40px"
                className="w-full h-full object-cover"
              />
            ) : (
              <Tag size={16} className="text-neutral-400" />
            )}
          </div>
        );
      },
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
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const isActive = status === "active" || status === "ACTIVE";
        return (
          <span
            className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase inline-block ${isActive
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800"
              }`}
          >
            {isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "অ্যাকশন",
      enableHiding: false,
      cell: ({ row }) => {
        const cat = row.original;
        return (
          <PermissionGate permission={PERMISSIONS.CATALOG_MANAGE}>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => openEdit(cat)}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                title="সম্পাদনা করুন"
              >
                <Edit2 size={15} />
              </button>

              {/* 🛡️ Delete is strictly gated to the Store OWNER */}
              {userRole === "OWNER" && (
                <button
                  type="button"
                  onClick={() => setDeleteTarget(cat)}
                  className="p-1.5 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                  title="মুছে ফেলুন"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </PermissionGate>
        );
      },
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
      <Breadcrumbs items={[{ label: "পণ্য ক্যাটাগরি" }]} />

      {/* Header */}
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
              onClick={openCreate}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus size={16} /> নতুন ক্যাটাগরি যোগ
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 rounded-2xl shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
          <input
            type="text"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="ক্যাটাগরির নাম দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-neutral-900 dark:text-neutral-100"
          />
        </div>
      </div>

      <DataTable table={table} columns={columns} />

      {/* 🛡️ Key-reset prevents stale CategoryForm uncontrolled state */}
      <FormModal
        key={editingCategory?.id || "new-category-modal"}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingCategory(null);
        }}
        onSubmit={handleFormSubmit}
        title={editingCategory ? "ক্যাটাগরি সম্পাদনা" : "নতুন ক্যাটাগরি তৈরি"}
        description="ক্যাটাগরির নাম, ছবি ও বিবরণ নির্ধারণ করুন।"
        isEditing={Boolean(editingCategory)}
        loading={loading}
      >
        <CategoryForm editingCategory={editingCategory} />
      </FormModal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="ক্যাটাগরি মুছে ফেলুন"
        message={`আপনি কি নিশ্চিতভাবে "${deleteTarget?.name}" মুছে ফেলতে চান? ডিস্ক থেকে এর ছবিও মুছে ফেলা হবে।`}
        confirmLabel="ক্যাটাগরি মুছুন"
        loading={loading}
      />
    </div>
  );
}