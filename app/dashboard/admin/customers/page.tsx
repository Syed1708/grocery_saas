
import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import { getCustomers } from "@/queries/customer-queries";
import { prisma } from "@/lib/prisma";
import CustomersClient from "./_components/CustomersClient";

export default async function CustomersPage() {
  // 🛡️ Zero-Trust Guard: Enforce permissions and active status
  const user = await requireAuth({
    requiredPermission: PERMISSIONS.POS_ACCESS,
    requireActiveStatus: true,
  });

  const { shopId, activeBranchId, role } = user;

  // Parallel server queries scoped strictly to activeBranchId
  const [customers, shop] = await Promise.all([
    getCustomers(shopId, activeBranchId),
    prisma.shop.findUnique({
      where: { id: shopId },
      select: { currencySymbol: true },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <CustomersClient
        data={customers}
        currencySymbol={shop?.currencySymbol || "৳"}
        userRole={role}
      />
    </div>
  );
}