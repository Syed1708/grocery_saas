"use client";

import React from "react";
import { LucideIcon, Plus } from "lucide-react";
import { PermissionGate } from "@/components/common/PermissionGate";
import { PermissionKey } from "@/types";
import { cn } from "@/lib/utils";

interface ModuleHeaderProps {
  title: string;
  subtitle?: string;
  /** Extra controls rendered next to the add button (e.g. DataTableViewOptions). */
  actions?: React.ReactNode;
  /** When provided, renders the primary add button. */
  onAdd?: () => void;
  addLabel?: string;
  addIcon?: LucideIcon;
  /** Optional permission gate for the add button. */
  addPermission?: PermissionKey;
  titleClassName?: string;
}

export function ModuleHeader({
  title,
  subtitle,
  actions,
  onAdd,
  addLabel,
  addIcon: AddIcon = Plus,
  addPermission,
  titleClassName = "text-2xl",
}: ModuleHeaderProps) {
  const addButton = onAdd ? (
    <button
      type="button"
      onClick={onAdd}
      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
    >
      <AddIcon size={16} /> {addLabel}
    </button>
  ) : null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1
          className={cn(
            "font-bold text-neutral-900 dark:text-neutral-100 tracking-tight",
            titleClassName
          )}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{subtitle}</p>
        )}
      </div>

      {(actions || addButton) && (
        <div className="flex items-center gap-2">
          {actions}
          {addButton &&
            (addPermission ? (
              <PermissionGate permission={addPermission}>{addButton}</PermissionGate>
            ) : (
              addButton
            ))}
        </div>
      )}
    </div>
  );
}
