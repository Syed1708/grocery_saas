// app/(dashboard)/admin/users/_components/UsersClientView.tsx
"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import UsersTable, { IUserItem } from "./UsersTable";
import UserModal from "./UserModal";
import { saveUserAction, toggleUserStatusAction, deleteUserAction } from "@/app/actions/users-actions";

interface Props {
  initialUsers: IUserItem[];
  branches: Array<{ id: string; name: string; code: string }>;
}

export default function UsersClientView({ initialUsers, branches }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IUserItem | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: IUserItem) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      await saveUserAction(formData);
      toast.success(selectedUser ? "Staff member updated." : "Staff member created.");
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Operation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await toggleUserStatusAction(userId, currentStatus);
      toast.success("User status updated.");
    } catch (err: any) {
      toast.error(err.message || "Failed to update status.");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this staff member? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteUserAction(userId);
      toast.success("Staff member deleted successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Staff & Users Management
          </h1>
          <p className="text-xs text-neutral-500">
            Manage operational branch managers and cashiers, POS PINs, and permissions.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition text-xs font-semibold shadow-xs cursor-pointer"
        >
          <UserPlus size={15} /> Add Staff Member
        </button>
      </div>

      {/* 👈 Ensure onDelete is passed here */}
      <UsersTable
        users={initialUsers}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
      />

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        loading={loading}
        user={selectedUser}
        branches={branches}
      />
    </div>
  );
}