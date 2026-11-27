import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import { prisma } from "@/lib/prisma";
import { getPurchaseReportData } from "@/queries/purchase-report-queries";
import PurchaseReportClient from "./_components/PurchaseReportClient";
import { IPurchaseFilterParams } from "@/types/purchases";

interface PageProps {
  searchParams: Promise<
    IPurchaseFilterParams & { page?: string; pageSize?: string; tab?: string }
  >;
}

const PAGE_SIZES = [10, 20, 50, 100];

function parsePage(value: string | undefined): number {
  const page = Number(value);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

export default async function PurchaseReportPage({ searchParams }: PageProps) {
  const { shopId, activeBranchId: branchId } = await requireAuth({
    requiredPermission: PERMISSIONS.REPORTS_PURCHASES,
    requireActiveStatus: true,
  });
  const rawFilters = await searchParams;
  const parsedPageSize = Number(rawFilters.pageSize);
  const pageSize = PAGE_SIZES.includes(parsedPageSize) ? parsedPageSize : 10;
  const page = parsePage(rawFilters.page);
  const dueOnly = rawFilters.tab === "due";

  const [purchaseData, suppliers, shop, branch] = await Promise.all([
    getPurchaseReportData(shopId, branchId, rawFilters, page, pageSize, dueOnly),
    prisma.supplier.findMany({
      where: { shopId, status: "active" },
      select: { id: true, name: true, companyName: true },
    }),
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
      <PurchaseReportClient
        kpis={purchaseData.kpis}
        rows={purchaseData.rows}
        rowsTotal={purchaseData.rowsTotal}
        dueTotal={purchaseData.dueTotal}
        page={purchaseData.rowsPage}
        pageSize={purchaseData.rowsPageSize}
        filters={rawFilters}
        currencySymbol={shop?.currencySymbol || "৳"}
        suppliers={suppliers}
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