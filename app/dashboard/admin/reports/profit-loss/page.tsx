import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import { prisma } from "@/lib/prisma";
import { getProfitLossData } from "@/queries/profit-loss-queries";
import ProfitLossClient from "./_components/ProfitLossClient";
import { IProfitLossFilterParams } from "@/types/profit-loss";

interface PageProps {
  searchParams: Promise<IProfitLossFilterParams>;
}

export default async function ProfitLossPage({ searchParams }: PageProps) {
  const { shopId, activeBranchId: branchId } = await requireAuth({
    requiredPermission: PERMISSIONS.REPORTS_PL_PROFIT,
    requireActiveStatus: true,
  });
  const filters = await searchParams;

  const [plData, shop, branch] = await Promise.all([
    getProfitLossData(shopId, branchId, filters),
    prisma.shop.findUnique({
      where: { id: shopId },
      select: { name: true, phone: true, address: true, currencySymbol: true },
    }),
    prisma.branch.findUnique({
      where: { id: branchId },
      select: { name: true },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <ProfitLossClient
        data={plData}
        currencySymbol={shop?.currencySymbol || "৳"}
        shop={{
          name: shop?.name || "Grocery ERP",
          phone: shop?.phone,
          address: shop?.address,
        }}
        branchName={branch?.name || "Main Branch"}
      />
    </div>
  );
}