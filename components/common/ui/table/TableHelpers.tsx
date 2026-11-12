"use client";

import React from "react";
import Image from "next/image";
import { Printer, Eye, Edit2, Trash2 } from "lucide-react";
import { PermissionGate } from "@/components/common/PermissionGate";
import { PermissionKey } from "@/types";

// ==========================================
// 1. TABLE THUMBNAIL IMAGE
// ==========================================
export function TableImage({
  src,
  fallbackIcon,
}: {
  src?: string | null;
  fallbackIcon: React.ReactNode;
}) {
  return (
    <div className="w-10 h-10 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shrink-0">
      {src ? (
        <Image
          src={src}
          alt=""
          width={40}
          height={40}
          sizes="40px"
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-neutral-400">{fallbackIcon}</span>
      )}
    </div>
  );
}

// ==========================================
// 2. STATUS BADGE (Fixed: Accepts undefined/null)
// ==========================================
export function StatusBadge({ status }: { status?: string | null }) {
  const isActive = status === "active" || status === "ACTIVE";
  return (
    <span
      className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase inline-block ${
        isActive
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
          : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800"
      }`}
    >
      {isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
    </span>
  );
}

// ==========================================
// 3. TABLE ROW ACTIONS (Print, View, Edit, Delete)
// ==========================================
interface TableActionsProps {
  onPrint?: () => void;
  canPrint?: boolean;
  printPermission?: PermissionKey;

  onView?: () => void;
  canView?: boolean;
  viewPermission?: PermissionKey;

  onEdit?: () => void;
  canEdit?: boolean;
  editPermission?: PermissionKey;

  onDelete?: () => void;
  canDelete?: boolean;
  deletePermission?: PermissionKey;
}

export function TableActions({
  onPrint,
  canPrint = true,
  printPermission,
  onView,
  canView = true,
  viewPermission,
  onEdit,
  canEdit = true,
  editPermission,
  onDelete,
  canDelete = true,
  deletePermission,
}: TableActionsProps) {
  const wrapWithGate = (node: React.ReactNode, permission?: PermissionKey) => {
    return permission ? <PermissionGate permission={permission}>{node}</PermissionGate> : node;
  };

  return (
    <div className="flex items-center gap-1">
      {onPrint && canPrint &&
        wrapWithGate(
          <button
            type="button"
            onClick={onPrint}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-purple-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            title="প্রিন্ট করুন"
          >
            <Printer size={15} />
          </button>,
          printPermission
        )}

      {onView && canView &&
        wrapWithGate(
          <button
            type="button"
            onClick={onView}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-emerald-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            title="বিস্তারিত দেখুন"
          >
            <Eye size={15} />
          </button>,
          viewPermission
        )}

      {onEdit && canEdit &&
        wrapWithGate(
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            title="সম্পাদনা করুন"
          >
            <Edit2 size={15} />
          </button>,
          editPermission
        )}

      {onDelete && canDelete &&
        wrapWithGate(
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            title="মুছে ফেলুন"
          >
            <Trash2 size={15} />
          </button>,
          deletePermission
        )}
    </div>
  );
}