"use client";
"use no memo";

import {
  ColumnDef,
  flexRender,
  Table as TableType,
} from "@tanstack/react-table";
import { DataTablePagination } from "./DataTablePagination";

interface DataTableProps<TData, TValue> {
  table: TableType<TData>;
  columns: ColumnDef<TData, TValue>[];
}

export function DataTable<TData, TValue>({
  table,
  columns,
}: DataTableProps<TData, TValue>) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="p-3.5 font-bold">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80 text-neutral-700 dark:text-neutral-300">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-3.5 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center text-neutral-400">
                  No matching products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Standalone Pagination Attached to Bottom of Table */}
      <DataTablePagination table={table} />
    </div>
  );
}