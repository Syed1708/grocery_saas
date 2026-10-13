"use client";

import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import { UserRole } from "@/types";

interface BranchOption {
  id: string;
  name: string;
  code: string;
  isMain: boolean;
}

interface DashboardShellProps {
  children: React.ReactNode;
  role: UserRole;
  userName: string;
  shopName: string;
  branches: BranchOption[];
  currentBranchId?: string | null;
  currentBranchName?: string | null;
}

export default function DashboardShell({
  children,
  role,
  userName,
  shopName,
  branches,
  currentBranchId,
  currentBranchName,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);

  function handleToggleSidebar() {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setMobileOpen((prev) => !prev);
    } else {
      setDesktopOpen((prev) => !prev);
    }
  }

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 overflow-hidden font-sans transition-colors">
      <Sidebar
        role={role}
        isMobileOpen={mobileOpen}
        isDesktopOpen={desktopOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          role={role}
          userName={userName}
          shopName={shopName}
          branches={branches}
          currentBranchId={currentBranchId}
          currentBranchName={currentBranchName}
          onToggleSidebar={handleToggleSidebar}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}