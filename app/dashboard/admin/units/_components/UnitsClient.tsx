"use client";
"use no memo";

import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Scale } from "lucide-react";
import { DataTable } from "@/components/common/data-table/DataTable";
import FormModal from "@/components/common/FormModal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { ModuleHeader } from "@/components/common/ModuleHeader";
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
      <ModuleHeader
        title="Units of Measurement"
        subtitle="Manage measurement units and bulk packaging conversions"
        onAdd={crud.openCreate}
        addLabel="Add Unit"
        addPermission={PERMISSIONS.CATALOG_MANAGE}
      />

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
