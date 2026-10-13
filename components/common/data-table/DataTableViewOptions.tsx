"use client";

import { useState } from "react";
import { Table } from "@tanstack/react-table";
import { SlidersHorizontal } from "lucide-react";

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
}

export function DataTableViewOptions<TData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition cursor-pointer"
      >
        <SlidersHorizontal size={14} /> Columns
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg p-2 z-30 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-2 block">
            Toggle Columns
          </span>
          {table
            .getAllLeafColumns()
            .filter((column) => column.getCanHide())
            .map((column) => (
              <label
                key={column.id}
                className="flex items-center gap-2 px-2 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={column.getIsVisible()}
                  onChange={column.getToggleVisibilityHandler()}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="capitalize">{column.id}</span>
              </label>
            ))}
        </div>
      )}
    </div>
  );
}