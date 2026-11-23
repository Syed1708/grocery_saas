import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import { prisma } from "@/lib/prisma";
import { getFamilyReportData } from "@/queries/family-report-queries";
import FamilyReportClient from "./_components/FamilyReportClient";
import { IFamilyReportFilters } from "@/types/partner";

interface PageProps {
  searchParams: Promise<IFamilyReportFilters>;
}

export default async function FamilyReportPage({ searchParams }: PageProps) {
  const { shopId, activeBranchId: branchId } = await requireAuth({
    requiredPermission: PERMISSIONS.FAMILY_LEDGER_ACCESS,
    requireActiveStatus: true,
  });

  const filters = await searchParams;

  const [data, shop, branch, partnerOptions] = await Promise.all([
    getFamilyReportData(shopId, branchId, filters),
    prisma.shop.findUnique({
      where: { id: shopId },
      select: { name: true, phone: true, address: true, currencySymbol: true },
    }),
    prisma.branch.findUnique({
      where: { id: branchId },
      select: { name: true },
    }),
    prisma.partner.findMany({
      where: { shopId, status: "active" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <FamilyReportClient
      data={data}
      partnerOptions={partnerOptions}
      currencySymbol={shop?.currencySymbol || "৳"}
      shop={{
        name: shop?.name || "Grocery ERP",
        phone: shop?.phone,
        address: shop?.address,
      }}
      branchName={branch?.name || "Main Branch"}
    />
  );
}
