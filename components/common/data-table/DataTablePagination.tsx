"use client";

import { Table } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 border-t border-neutral-100 dark:border-neutral-800 dark:bg-neutral-850 text-xs">
      {/* Selected Rows count / total count */}
      <div className="text-neutral-500 dark:text-neutral-400">
        Total: <strong>{table.getFilteredRowModel().rows.length}</strong> items found
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        {/* Rows per page selector */}
        <div className="flex items-center gap-2">
          <span className="text-neutral-500 dark:text-neutral-400">Rows per page</span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="px-2 py-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200 outline-none cursor-pointer"
          >
            {[10, 20, 50, 100].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
        </div>

        {/* Page counter */}
        <div className="text-neutral-600 dark:text-neutral-300 font-medium">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount() || 1}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 disabled:opacity-30 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            title="First Page"
          >
            <ChevronsLeft size={15} />
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 disabled:opacity-30 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            title="Previous Page"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 disabled:opacity-30 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            title="Next Page"
          >
            <ChevronRight size={15} />
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 disabled:opacity-30 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            title="Last Page"
          >
            <ChevronsRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}