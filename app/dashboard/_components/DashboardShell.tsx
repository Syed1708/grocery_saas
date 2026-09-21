"use client";

import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import { UserRole } from "@/types/user";

interface DashboardShellProps {
  children: React.ReactNode;
  role: UserRole;
  userName: string;
  shopName: string;
}

export default function DashboardShell({
  children,
  role,
  userName,
  shopName,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);

  function handleToggleSidebar() {
    // If on mobile (less than 768px), toggle mobile overlay
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setMobileOpen((prev) => !prev);
    } else {
      // On desktop, collapse/expand the sidebar
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
          onToggleSidebar={handleToggleSidebar}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}