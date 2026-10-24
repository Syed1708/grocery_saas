import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getReportsOverviewStats } from "@/queries/reports-overview-queries";
import ReportsOverviewClient from "./overview/reports-overview-client";

export default async function ReportsRootPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.shopId || !session?.user?.branchId) {
    redirect("/login");
  }

  const { shopId, branchId } = session.user;

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