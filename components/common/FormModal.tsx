"use client";

import Modal from "./Modal";
import { Loader2 } from "lucide-react";

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  loading?: boolean;
  submitLabel?: string;
  isEditing?: boolean;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

export default function FormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  children,
  loading = false,
  submitLabel,
  isEditing = false,
  maxWidth = "md",
}: FormModalProps) {
  const defaultLabel = isEditing ? "Update" : "Create";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      maxWidth={maxWidth}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {children}

        {/* Standardized Form Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            {submitLabel || defaultLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}