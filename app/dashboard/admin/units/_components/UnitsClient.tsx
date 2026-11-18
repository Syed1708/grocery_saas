"use client";
"use no memo";

import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Plus, Scale } from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";
import FormModal from "@/components/common/FormModal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { PermissionGate } from "@/components/common/PermissionGate";
import { useCrudModal } from "@/hooks/useCrudModal";
import { createUnitAction, deleteUnitAction } from "@/app/actions/unit-actions";
import { PERMISSIONS } from "@/types";
import { TableActions } from "@/components/common/ui/table/TableHelpers";
import UnitForm from "./UnitForm";

interface UnitData {
  id: string;
  name: string;
  code: string;
  _count: { products: number };
}

export default function UnitsClient({ data }: { data: UnitData[] }) {
  // Universal CRUD state & mutation engine
  const crud = useCrudModal<UnitData>({
    createAction: createUnitAction,
    deleteAction: deleteUnitAction,
    entityName: "ইউনিট",
  });

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
        <TableActions
          onDelete={() => crud.setDeleteTarget(row.original)}
          canDelete={row.original._count.products === 0}
          deletePermission={PERMISSIONS.CATALOG_MANAGE}
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
        <PermissionGate permission={PERMISSIONS.CATALOG_MANAGE}>
          <button
            onClick={crud.openCreate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus size={16} /> Add Unit
          </button>
        </PermissionGate>
      </div>

      <DataTable table={table} columns={columns} />

      <FormModal
        key={crud.isOpen ? "new-unit-modal" : "closed-unit-modal"}
        isOpen={crud.isOpen}
        onClose={crud.closeModal}
        onSubmit={crud.handleSubmit}
        title="Add Measurement Unit"
        description="Create standard or packaging units (e.g. Carton, Sachet, Tin, Bundle)."
        loading={crud.loading}
        submitLabel="Create Unit"
      >
        <UnitForm errors={crud.errors} />
      </FormModal>

      <ConfirmDialog
        isOpen={Boolean(crud.deleteTarget)}
        onClose={() => crud.setDeleteTarget(null)}
        onConfirm={crud.handleDeleteConfirm}
        title="Delete Unit"
        message={`Are you sure you want to delete unit "${crud.deleteTarget?.name}"?`}
        confirmLabel="Delete Unit"
        loading={crud.loading}
      />
    </div>
  );
}
