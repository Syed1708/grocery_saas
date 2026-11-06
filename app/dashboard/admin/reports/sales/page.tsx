// app/(dashboard)/reports/sales/page.tsx

import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import { prisma } from "@/lib/prisma";
import { getSalesReportData } from "@/queries/sales-report-queries";
import { ISalesFilterParams } from "@/types/index";
import SalesReportClient from "./_components/sales-report-client";

interface PageProps {
  searchParams: Promise<ISalesFilterParams>;
}

export default async function SalesReportPage({ searchParams }: PageProps) {
  // 🛡️ Zero-Trust Guard: Enforce permissions and active status
  const user = await requireAuth({
    requiredPermission: PERMISSIONS.POS_ACCESS,
    requireActiveStatus: true,
  });

  const { shopId, activeBranchId, role } = user;
  const filters = await searchParams;

  // Parallel server queries scoped strictly to activeBranchId
  const [reportData, shop, branch] = await Promise.all([
    getSalesReportData(shopId, activeBranchId, filters),
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
        itemVelocity={reportData.itemVelocity}
        currencySymbol={shop?.currencySymbol || "৳"}
        filters={filters}
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