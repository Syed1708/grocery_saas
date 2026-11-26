import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import { getPastClosings, getCurrentShiftSummary } from "@/queries/closing-queries";
import ClosingsClient from "./_components/ClosingsClient";
import { prisma } from "@/lib/prisma";

const PAGE_SIZES = [10, 20, 50, 100];

function parsePage(value: string | undefined): number {
  const page = Number(value);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

export default async function ClosingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
  const { shopId, activeBranchId: branchId } = await requireAuth({
    requiredPermission: PERMISSIONS.REPORTS_CLOSING_Z,
    requireActiveStatus: true,
  });

  const rawFilters = await searchParams;
  const parsedPageSize = Number(rawFilters.pageSize);
  const pageSize = PAGE_SIZES.includes(parsedPageSize) ? parsedPageSize : 10;
  const page = parsePage(rawFilters.page);

  const [closingsResult, shiftSummary, shop, branch] = await Promise.all([
    getPastClosings(shopId, branchId, page, pageSize),
    getCurrentShiftSummary(shopId, branchId),
    prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        name: true,
        phone: true,
        address: true,
        currencySymbol: true,
      },
    }),
    prisma.branch.findUnique({
      where: { id: branchId },
      select: { name: true },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <ClosingsClient
        data={closingsResult.items}
        total={closingsResult.total}
        page={closingsResult.page}
        pageSize={closingsResult.pageSize}
        shiftSummary={shiftSummary}
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