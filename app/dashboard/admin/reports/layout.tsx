import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { redirect } from "next/navigation";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { ReportsNavTabs } from "./common/reports-nav-tabs";

export default async function ReportsLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.shopId || !session?.user?.branchId) {
    redirect("/login");
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Universal Reports Header (Hidden in Print Mode) */}
      <div className="space-y-3 print:hidden">
        <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Reports & Financials" }]} />
        
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Reports & Business Intelligence
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Real-time grocery retail metrics, sales reconciliations, stock ledger, and profit analysis.
          </p>
        </div>

        {/* Persistent Tab Bar */}
        <ReportsNavTabs />
      </div>

      {/* Dynamic Tab Body */}
      <div>{children}</div>
    </div>
  );
}