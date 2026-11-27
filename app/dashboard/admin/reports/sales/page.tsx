// app/(dashboard)/reports/sales/page.tsx

import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import { prisma } from "@/lib/prisma";
import { getSalesReportData } from "@/queries/sales-report-queries";
import { ISalesFilterParams } from "@/types/index";
import SalesReportClient from "./_components/sales-report-client";

interface PageProps {
  searchParams: Promise<ISalesFilterParams & { page?: string; pageSize?: string }>;
}

const PAGE_SIZES = [10, 20, 50, 100];

function parsePage(value: string | undefined): number {
  const page = Number(value);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

export default async function SalesReportPage({ searchParams }: PageProps) {
  // 🛡️ Zero-Trust Guard: Enforce permissions and active status
  const user = await requireAuth({
    requiredPermission: PERMISSIONS.REPORTS_SALES,
    requireActiveStatus: true,
  });

  const { shopId, activeBranchId, role } = user;
  const rawFilters = await searchParams;
  const parsedPageSize = Number(rawFilters.pageSize);
  const pageSize = PAGE_SIZES.includes(parsedPageSize) ? parsedPageSize : 10;
  const page = parsePage(rawFilters.page);

  // Parallel server queries scoped strictly to activeBranchId
  const [reportData, shop, branch] = await Promise.all([
    getSalesReportData(shopId, activeBranchId, rawFilters, page, pageSize),
    prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        name: true,
        phone: true,
        email: true,
        address: true,
        binVatNumber: true,
        tradeLicense: true,
        currencySymbol: true,
      },
    }),
    prisma.branch.findUnique({
      where: { id: activeBranchId },
      select: { name: true },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <SalesReportClient
        kpis={reportData.kpis}
        invoices={reportData.invoices}
        invoicesTotal={reportData.invoicesTotal}
        page={reportData.invoicePage}
        pageSize={reportData.invoicePageSize}
        itemVelocity={reportData.itemVelocity}
        currencySymbol={shop?.currencySymbol || "৳"}
        filters={rawFilters}
        shop={{
          name: shop?.name || "Grocery Store",
          phone: shop?.phone,
          email: shop?.email,
          address: shop?.address,
          binVatNumber: shop?.binVatNumber,
          tradeLicense: shop?.tradeLicense,
        }}
        branchName={branch?.name || "Main Branch"}
        userRole={role}
      />
    </div>
  );
}