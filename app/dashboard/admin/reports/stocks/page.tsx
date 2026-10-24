import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStockReportData } from "@/queries/stock-report-queries";
import StockReportClient from "./_components/StockReportClient";
import { IStockFilterParams } from "@/types/stock";

interface PageProps {
  searchParams: Promise<IStockFilterParams>;
}

export default async function StockReportPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.shopId || !session?.user?.branchId) {
    redirect("/login");
  }

  const { shopId, branchId } = session.user;
  const filters = await searchParams;

  const [stockData, categories, brands, sections, shop, branch] = await Promise.all([
    getStockReportData(shopId, branchId, filters),
    prisma.category.findMany({ where: { shopId, status: "active" }, select: { id: true, name: true } }),
    prisma.brand.findMany({ where: { shopId, status: "active" }, select: { id: true, name: true } }),
    prisma.productSection.findMany({ where: { shopId, status: "active" }, select: { id: true, name: true, code: true } }),
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
      <StockReportClient
        kpis={stockData.kpis}
        rows={stockData.rows}
        currencySymbol={shop?.currencySymbol || "৳"}
        categories={categories}
        brands={brands}
        sections={sections}
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