"use client";

import { useState } from "react";
import { User, Lock, Mail, Phone, Shield, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateProfileAction, updatePasswordAction } from "@/app/actions/profile-actions";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import ImageUpload from "@/components/common/ImageUpload";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  profileImage: string | null;
  shopName: string;
  branchName: string;
}

export default function ProfileClient({ user }: { user: ProfileData }) {
  const [activeTab, setActiveTab] = useState<"info" | "security">("info");
  const [loading, setLoading] = useState(false);

  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const res = await updateProfileAction(formData);

    setLoading(false);
    if (res.success) {
      toast.success("Profile information updated successfully!");
    } else {
      toast.error(res.error || "Failed to update profile.");
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const res = await updatePasswordAction(formData);

    setLoading(false);
    if (res.success) {
      toast.success("Password changed successfully!");
      form.reset();
    } else {
      toast.error(res.error || "Failed to change password.");
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 👈 Reusable Breadcrumbs */}
      <Breadcrumbs items={[{ label: "My Profile" }]} />

      {/* Header Banner */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-center gap-5">
        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-blue-50 dark:bg-neutral-800 border-2 border-blue-500 flex items-center justify-center shrink-0 text-2xl font-bold text-blue-600">
          {user.profileImage ? (
            <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            user.name.charAt(0).toUpperCase()
          )}
        </div>

        <div className="text-center sm:text-left space-y-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{user.name}</h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              {user.role}
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {user.shopName} • {user.branchName}
          </p>
          <p className="text-xs text-neutral-400 flex items-center justify-center sm:justify-start gap-1">
            <Mail size={12} /> {user.email}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
        <button
          onClick={() => setActiveTab("info")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === "info"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
        >
          <User size={14} /> Personal Details
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === "security"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
        >
          <Lock size={14} /> Change Password
        </button>
      </div>

      {/* TAB 1: General Info */}
      {activeTab === "info" && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs">
          <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 text-neutral-400" size={15} />
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={user.name}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Email Address (Read-only)
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 text-neutral-400" size={15} />
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Mobile Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 text-neutral-400" size={15} />
                <input
                  type="text"
                  name="phone"
                  defaultValue={user.phone || ""}
                  placeholder="01700000000"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <ImageUpload
              name="profileImage"
              defaultImage={user.profileImage}
              label="Update Profile Photo"
            />

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-xs"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: Change Password */}
      {activeTab === "security" && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs">
          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Current Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 text-neutral-400" size={15} />
                <input
                  type="password"
                  name="currentPassword"
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                New Password (6+ characters) *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 text-neutral-400" size={15} />
                <input
                  type="password"
                  name="newPassword"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Confirm New Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 text-neutral-400" size={15} />
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-xs"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                Update Password
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}