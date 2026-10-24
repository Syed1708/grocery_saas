"use client";
"use no memo";

import { useState } from "react";
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
import CategoryForm from "./CategoryForm"; // 👈 Clean extracted form
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "@/app/actions/category-actions";
import { ICategory } from "@/types";
import Image from "next/image";

export default function CategoriesClient({ data }: { data: ICategory[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ICategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ICategory | null>(null);
  const [loading, setLoading] = useState(false);

  // Table Filter States
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

  async function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
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
        editingCategory
          ? "Category updated successfully!"
          : "Category created successfully!"
      );
      setModalOpen(false);
    } else {
      toast.error(res.error || "Operation failed.");
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setLoading(true);

    const res = await deleteCategoryAction(deleteTarget.id);
    setLoading(false);

    if (res.success) {
      toast.success(`"${deleteTarget.name}" deleted successfully!`);
      setDeleteTarget(null);
    } else {
      toast.error(res.error || "Failed to delete category.");
    }
  }

  const columns: ColumnDef<ICategory>[] = [
    {
      accessorKey: "image",
      header: "Photo",
      enableHiding: false,
      cell: ({ row }) => {
        const image = row.getValue("image") as string | null;
        return (
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center">
            {image ? (
              <Image 
                src={image}
                alt="Category"
                width={40}
                height={40}
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
      header: "Category Name",
      cell: ({ row }) => (
        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
          {row.getValue("name")}
        </span>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="text-neutral-500 dark:text-neutral-400 truncate max-w-xs block">
          {row.getValue("description") || "—"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span className="text-neutral-500 dark:text-neutral-400 truncate max-w-xs block">
          {row.getValue("status") || "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        const cat = row.original;
        return (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => openEdit(cat)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="Edit"
            >
              <Edit2 size={15} />
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(cat)}
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
    data,
    columns,
    state: {
      globalFilter,
      columnVisibility,
    },
    onGlobalFilterChange: setGlobalFilter,
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
            Categories
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Organize products with photos for rapid barcode scanning and POS lookups
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DataTableViewOptions table={table} />
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus size={16} /> Add Category
          </button>
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
            placeholder="Search categories by name..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-neutral-900 dark:text-neutral-100"
          />
        </div>
      </div>

      <DataTable table={table} columns={columns} />

      {/* Reusable FormModal with Clean Form Component */}
      <FormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleFormSubmit}
        title={editingCategory ? "Edit Category" : "New Category"}
        description="Categories group products together on the POS cash register."
        isEditing={Boolean(editingCategory)}
        loading={loading}
      >
        <CategoryForm editingCategory={editingCategory} />
      </FormModal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Its image file will also be permanently removed from disk.`}
        confirmLabel="Delete Category"
        loading={loading}
      />
    </div>
  );
}