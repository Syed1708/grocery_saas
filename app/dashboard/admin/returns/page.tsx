import { requireAuth } from "@/lib/auth/guard";
import { IPosShopConfig, PERMISSIONS } from "@/types";
import { getSaleReturns } from "@/queries/return-queries";
import { prisma } from "@/lib/prisma";
import ReturnsClient from "./_components/ReturnsClient";

const PAGE_SIZES = [10, 20, 50, 100];

function parsePage(value: string | undefined): number {
  const page = Number(value);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

export default async function ReturnsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
  // 1. Zero-Trust Guard: Enforce permissions & active status
  const user = await requireAuth({
    requiredPermission: PERMISSIONS.POS_ACCESS,
    requireActiveStatus: true,
  });

  const { shopId, activeBranchId } = user;
  const rawFilters = await searchParams;
  const parsedPageSize = Number(rawFilters.pageSize);
  const pageSize = PAGE_SIZES.includes(parsedPageSize) ? parsedPageSize : 10;
  const page = parsePage(rawFilters.page);

  // 2. Fetch Returns scoped strictly to the active branch (already number-normalized)
  const [returnsResult, rawShop] = await Promise.all([
    getSaleReturns(shopId, activeBranchId, page, pageSize),
    prisma.shop.findUnique({
      where: { id: shopId },
      select: { name: true,
      phone: true,
      address: true,
      currencySymbol: true,
      thermalWidth: true,
      invoiceHeader: true,
      invoiceFooter: true, },
    }),
  ]);

  const shop: IPosShopConfig = {
  name: rawShop?.name || "GROCERY STORE",
  phone: rawShop?.phone || "",
  address: rawShop?.address || "",
  currencySymbol: rawShop?.currencySymbol || "৳",
  enableVat: false,
  vatPercent: 0,
  thermalWidth: rawShop?.thermalWidth || "80mm",
  invoiceHeader: rawShop?.invoiceHeader || null,
  invoiceFooter: rawShop?.invoiceFooter || null,
};

  return (
    <div className="max-w-7xl mx-auto">
      <ReturnsClient
        data={returnsResult.items}
        total={returnsResult.total}
        page={returnsResult.page}
        pageSize={returnsResult.pageSize}
        shop={shop}
        currencySymbol={shop?.currencySymbol || "৳"}
      />
    </div>
  );
}