
import { requireAuth } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "./_components/DashboardHeader";
import { DashboardKpis } from "./_components/DashboardKpis";
import { DashboardSideWidgets } from "./_components/DashboardSideWidgets";
import { getDashboardData } from "@/queries/dashboard-queries";
import { CategoryDonutChart } from "./_components/CategoryDonutChart";
import { PeakHoursChart } from "./_components/PeakHoursChart";
import { SalesTrendsChart } from "./_components/SalesTrendsChart";

export default async function DashboardPage() {
  const user = await requireAuth();
  const { success, data, error } = await getDashboardData();

  if (!success || !data) {
    return (
      <div className="p-8 text-rose-600 bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-200">
        ড্যাশবোর্ড লোড করতে সমস্যা হয়েছে: {error}
      </div>
    );
  }

  // Fetch active branch name for header context
  let branchName = "সকল শাখা (Consolidated)";
  if (user.activeBranchId) {
    const branch = await prisma.branch.findUnique({
      where: { id: user.activeBranchId },
      select: { name: true },
    });
    if (branch) branchName = branch.name;
  }

  return (
    <div className="space-y-6  max-w-[1600px] mx-auto">
      {/* 1. Context Header */}
      <DashboardHeader
        branchName={branchName}
        userName={user.userId ? "অ্যাডমিন" : "ম্যানেজার"}
        userRole={user.role}
      />

      {/* 2. Top Metric Strips (KPIs) */}
      <DashboardKpis kpis={data.kpis} />

      {/* 3. Middle Analytics (Area Chart + Category Share) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesTrendsChart data={data.salesTrends} />
        </div>
        <div>
          <CategoryDonutChart data={data.categoryShares} />
        </div>
      </div>

      {/* 4. Peak Traffic Hours */}
      <PeakHoursChart data={data.hourlyRush} />

      {/* 5. Live Invoices & Inventory Warnings */}
      <DashboardSideWidgets recentSales={data.recentSales} stockAlerts={data.stockAlerts} />
    </div>
  );
}