"use client";

import { signOut } from "next-auth/react";
import { Menu, LogOut, Store } from "lucide-react";
import { UserRole } from "@/types";
import ThemeToggle from "./ThemeToggle";
import BranchSwitcher from "./BranchSwitcher"; // 👈 Import BranchSwitcher

interface BranchOption {
  id: string;
  name: string;
  code: string;
  isMain: boolean;
}

interface TopbarProps {
  userName: string;
  shopName: string;
  role: UserRole;
  branches: BranchOption[]; // 👈 Array of store branches
  currentBranchId?: string | null;
  currentBranchName?: string | null;
  onToggleSidebar: () => void;
}

export default function Topbar({
  userName,
  shopName,
  role,
  branches,
  currentBranchId,
  currentBranchName,
  onToggleSidebar,
}: TopbarProps) {
  const isCashier = role === "CASHIER";

  return (
    <header className="h-16 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Toggle Button for Mobile & Desktop */}
        <button
          onClick={onToggleSidebar}
          className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
          title="Toggle Sidebar"
        >
          <Menu size={20} />
        </button>

        {/* Shop Name */}
        <div className="flex items-center gap-2">
          <Store size={18} className="text-neutral-400 hidden sm:block" />
          <span className="font-semibold text-neutral-800 dark:text-neutral-200 text-sm md:text-base tracking-tight truncate max-w-[150px] sm:max-w-xs">
            {shopName}
          </span>
        </div>

        {/* 👈 Dynamic Branch Switcher Dropdown */}
        <div className="ml-1 sm:ml-2">
          <BranchSwitcher
            branches={branches}
            currentBranchId={currentBranchId}
            currentBranchName={currentBranchName}
            isCashier={isCashier}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Night / Light Mode Toggle */}
        <ThemeToggle />

        {/* User Badge */}
        <div className="flex items-center gap-2 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 px-3 py-1.5 rounded-full">
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 hidden sm:inline">
            {userName}
          </span>
        </div>

        {/* Logout Button */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition cursor-pointer"
          title="Sign Out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}