"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard,
  TrendingUp, 
  Users, 
  Boxes, 
  Truck, 
  PieChart, 
  ReceiptText, 
  ShieldCheck 
} from "lucide-react";

export const reportTabs = [
  { label: "Overview", href: "/dashboard/admin/reports", icon: LayoutDashboard },
  { label: "Sales & Invoices", href: "/dashboard/admin/reports/sales", icon: TrendingUp },
  { label: "Customer Khata (বাকি)", href: "/dashboard/admin/reports/customers-due", icon: Users },
  { label: "Stock & Expiry", href: "/dashboard/admin/reports/stock", icon: Boxes },
  { label: "Purchases", href: "/dashboard/admin/reports/purchases", icon: Truck },
  { label: "Profit & Loss", href: "/dashboard/admin/reports/profit-loss", icon: PieChart },
  { label: "Expenses", href: "/dashboard/admin/reports/expenses", icon: ReceiptText },
  { label: "Z-Closing (কাউন্টার)", href: "/dashboard/admin/reports/closings", icon: ShieldCheck },
];

export function ReportsNavTabs() {
  const pathname = usePathname();

  return (
    <div className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 sticky top-0 z-10 -mx-4 px-4 sm:-mx-6 sm:px-6">
      <nav className="flex space-x-1 overflow-x-auto no-scrollbar py-2" aria-label="Reports Navigation">
        {reportTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.href === "/reports" ? pathname === "/reports" : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-bold"
                  : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}