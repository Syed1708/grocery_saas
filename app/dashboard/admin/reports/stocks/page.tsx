
import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import { prisma } from "@/lib/prisma";
import { getStockReportData } from "@/queries/stock-report-queries";
import StockReportClient from "./_components/StockReportClient";
import { IStockFilterParams } from "@/types/stock";

interface PageProps {
  searchParams: Promise<IStockFilterParams>;
}

export default async function StockReportPage({ searchParams }: PageProps) {
  // 🛡️ Zero-Trust Guard: Enforce permissions and active status
  const user = await requireAuth({
    requiredPermission: PERMISSIONS.POS_ACCESS,
    requireActiveStatus: true,
  });

  const { shopId, activeBranchId, role } = user;
  const filters = await searchParams;

  // Parallel server queries scoped strictly to activeBranchId
  const [stockData, categories, brands, sections, shop, branch] = await Promise.all([
    getStockReportData(shopId, activeBranchId, filters),
    prisma.category.findMany({ where: { shopId, status: "active" }, select: { id: true, name: true } }),
    prisma.brand.findMany({ where: { shopId, status: "active" }, select: { id: true, name: true } }),
    prisma.productSection.findMany({ where: { shopId, status: "active" }, select: { id: true, name: true, code: true } }),
    prisma.shop.findUnique({
      where: { id: shopId },
      select: { name: true, phone: true, address: true, currencySymbol: true },
    }),
    prisma.branch.findUnique({
      where: { id: activeBranchId },
      select: { name: true },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <StockReportClient
        kpis={stockData.kpis}
        rows={stockData.rows}
        currencySymbol={shop?.currencySymbol || "৳"}
        categories={categories}
        brands={brands}
        sections={sections}
        shop={{
          name: shop?.name || "Grocery Store",
          phone: shop?.phone,
          address: shop?.address,
        }}
        branchName={branch?.name || "Main Branch"}
        userRole={role}
      />
    </div>
  );
}