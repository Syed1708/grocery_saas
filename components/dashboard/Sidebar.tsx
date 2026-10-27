"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Tags,
  Package,
  Users,
  Truck,
  TrendingDown,
  RotateCcw,
  Receipt,
  Settings,
  X,
  GitBranch,
} from "lucide-react";
import { UserRole } from "@/types/user";

interface SidebarProps {
  role: UserRole;
  isMobileOpen: boolean;
  isDesktopOpen: boolean;
  onCloseMobile: () => void;
}

export default function Sidebar({
  role,
  isMobileOpen,
  isDesktopOpen,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard, roles: ["OWNER", "MANAGER", "CASHIER"] },
    { label: "POS Terminal", href: "/dashboard/pos", icon: ShoppingCart, roles: ["OWNER", "MANAGER", "CASHIER"] },
    { label: "Categories", href: "/dashboard/admin/categories", icon: Tags, roles: ["OWNER", "MANAGER"] },
    { label: "Products", href: "/dashboard/admin/products", icon: Package, roles: ["OWNER", "MANAGER"] },
    { label: "Sales & Invoices", href: "/dashboard/admin/sales", icon: Receipt, roles: ["OWNER", "MANAGER", "CASHIER"] },
    { label: "Sales Returns", href: "/dashboard/admin/returns", icon: RotateCcw, roles: ["OWNER", "MANAGER"] },
    { label: "Branches & Outlets", href: "/dashboard/admin/branches", icon: GitBranch, roles: ["OWNER"] },
    { label: "Customers", href: "/dashboard/admin/customers", icon: Users, roles: ["OWNER", "MANAGER", "CASHIER"] },
    { label: "Suppliers", href: "/dashboard/admin/suppliers", icon: Truck, roles: ["OWNER", "MANAGER"] },
    { label: "Purchases", href: "/dashboard/admin/purchases", icon: TrendingDown, roles: ["OWNER", "MANAGER"] },
    { label: "Accounts", href: "/dashboard/admin/accounts", icon: Settings, roles: ["OWNER", "MANAGER"] },

    { label: "Expenses", href: "/dashboard/admin/expenses", icon: TrendingDown, roles: ["OWNER", "MANAGER"] },
    { label: "Day-End Closings", href: "/dashboard/admin/closings", icon: Receipt, roles: ["OWNER", "MANAGER"] },
    { label: "Reports", href: "/dashboard/admin/reports", icon: Receipt, roles: ["OWNER", "MANAGER"] },
    { label: "Store Settings", href: "/dashboard/admin/settings", icon: Settings, roles: ["OWNER","MANAGER"] },
  ];

  const filteredNav = navItems.filter((item) => item.roles.includes(role));

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`
          fixed md:static top-0 left-0 h-screen z-50 flex flex-col
          bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800
          transition-all duration-300 ease-in-out
          ${/* Mobile behavior */ ""}
          ${isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"}
          ${/* Desktop collapse behavior */ ""}
          ${isDesktopOpen ? "md:w-64" : "md:w-0 md:opacity-0 md:pointer-events-none md:-ml-1"}
          overflow-hidden shrink-0
        `}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-neutral-900 dark:text-neutral-100">
            <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-base shadow-xs">
              G
            </span>
            <span className="truncate">GrocerySaaS</span>
          </Link>
          <button
            onClick={onCloseMobile}
            className="md:hidden text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition whitespace-nowrap ${isActive
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 font-semibold shadow-xs"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-200"
                  }`}
              >
                <Icon size={18} className={isActive ? "text-blue-600 dark:text-blue-400" : "text-neutral-400"} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Role Badge Footer */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 shrink-0">
          <div className="bg-neutral-50 dark:bg-neutral-800/60 rounded-xl p-3 flex items-center justify-between">
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Account Role</span>
            <span className="text-xs px-2 py-0.5 font-bold uppercase rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
              {role}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}