import { requireAuth } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { getReportsOverviewStats } from "@/queries/reports-overview-queries";
import ReportsOverviewClient from "./overview/reports-overview-client";

export default async function ReportsRootPage() {
  const { shopId, activeBranchId: branchId } = await requireAuth({
    requireActiveStatus: true,
  });

  const [stats, shop] = await Promise.all([
    getReportsOverviewStats(shopId, branchId),
    prisma.shop.findUnique({
      where: { id: shopId },
      select: { currencySymbol: true },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <ReportsOverviewClient
        stats={stats}
        currencySymbol={shop?.currencySymbol || "৳"}
      />
    </div>
  );
}