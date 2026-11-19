
import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import { prisma } from "@/lib/prisma";
import { getCustomerDueReportData } from "@/queries/customer-due-queries";
import CustomersDueClient from "./_components/customers-due-client";

interface PageProps {
  searchParams: Promise<{ search?: string; type?: string; aging?: string }>;
}

export default async function CustomerDueReportPage({ searchParams }: PageProps) {
  // 🛡️ Zero-Trust Guard: Enforce permissions and active status
  const user = await requireAuth({
    requiredPermission: PERMISSIONS.REPORTS_CUSTOMER_DUE,
    requireActiveStatus: true,
  });

  const { shopId, activeBranchId } = user;
  const { search, type, aging } = await searchParams;

  // Always scoped to the active branch (owners switch branch to view another)
  const targetBranchId = activeBranchId;

  const [data, shop, activeBranch] = await Promise.all([
    getCustomerDueReportData(shopId, targetBranchId, search, type, aging),
    prisma.shop.findUnique({
      where: { id: shopId },
      select: { name: true, currencySymbol: true },
    }),
    prisma.branch.findUnique({
      where: { id: activeBranchId },
      select: { name: true },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <CustomersDueClient
        kpis={data.kpis}
        customers={data.customers}
        currencySymbol={shop?.currencySymbol || "৳"}
        shopName={shop?.name || "Grocery Store"}
        branchName={activeBranch?.name || "Main Branch"}
      />
    </div>
  );
}