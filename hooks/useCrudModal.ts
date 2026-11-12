"use client";

import { useState } from "react";
import { toast } from "sonner";

interface ActionResponse {
  success: boolean;
  error?: string;
  errors?: Record<string, string>;
}

interface UseCrudModalOptions<T> {
  createAction?: (formData: FormData) => Promise<ActionResponse>;
  updateAction?: (formData: FormData) => Promise<ActionResponse>;
  deleteAction?: (id: string) => Promise<ActionResponse>;
  entityName: string; // e.g., "ক্যাটাগরি", "পণ্য", "স্থানান্তর চালান"
  onSuccess?: () => void;
}

export function useCrudModal<T extends { id: string; name?: string }>({
  createAction,
  updateAction,
  deleteAction,
  entityName,
  onSuccess,
}: UseCrudModalOptions<T>) {
  // 1. Form & Mutation State
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 2. 👈 Optional View Modal State
  const [viewingItem, setViewingItem] = useState<T | null>(null);
  const openView = (item: T) => setViewingItem(item);
  const closeView = () => setViewingItem(null);

  // 3. 👈 Optional Print Slip State (Auto-triggers window.print)
  const [printingItem, setPrintingItem] = useState<T | null>(null);
  const openPrint = (item: T, autoTrigger = true) => {
    setPrintingItem(item);
    if (autoTrigger) {
      requestAnimationFrame(() => {
        setTimeout(() => window.print(), 80);
      });
    }
  };
  const closePrint = () => setPrintingItem(null);

  // Modal Handlers
  const openCreate = () => {
    setEditingItem(null);
    setErrors({});
    setIsOpen(true);
  };

  const openEdit = (item: T) => {
    setEditingItem(item);
    setErrors({});
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditingItem(null);
    setErrors({});
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    if (editingItem) formData.append("id", editingItem.id);

    const res = editingItem
      ? await updateAction?.(formData)
      : await createAction?.(formData);

    setLoading(false);

    if (res?.success) {
      toast.success(
        editingItem
          ? `${entityName} তথ্য সফলভাবে আপডেট হয়েছে!`
          : `নতুন ${entityName} সফলভাবে যুক্ত হয়েছে!`
      );
      closeModal();
      onSuccess?.();
    } else {
      if (res?.errors) {
        setErrors(res.errors);
      } else if (res?.error) {
        setErrors({ general: res.error });
      }
      toast.error(res?.error || "অপারেশন ব্যর্থ হয়েছে।");
    }
  };

  // Delete Confirm Handler
  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !deleteAction) return;
    setLoading(true);

    const res = await deleteAction(deleteTarget.id);
    setLoading(false);

    if (res.success) {
      toast.success(`${entityName} "${deleteTarget.name || ""}" মুছে ফেলা হয়েছে।`);
      setDeleteTarget(null);
      onSuccess?.();
    } else {
      toast.error(res.error || "মুছে ফেলা সম্ভব হয়নি।");
    }
  };

  return {
    // Modal & Form
    isOpen,
    editingItem,
    deleteTarget,
    loading,
    errors,
    setErrors,
    openCreate,
    openEdit,
    closeModal,
    setDeleteTarget,
    handleSubmit,
    handleDeleteConfirm,

    // View & Print helpers
    viewingItem,
    openView,
    closeView,
    printingItem,
    openPrint,
    closePrint,
  };
}