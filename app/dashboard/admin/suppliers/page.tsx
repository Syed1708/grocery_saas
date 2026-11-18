import { requireAuth } from "@/lib/auth/guard";
import { getSuppliers } from "@/queries/supplier-queries";
import SuppliersClient from "./_components/SuppliersClient";
import { prisma } from "@/lib/prisma";

export default async function SuppliersPage() {
  const { shopId, activeBranchId: branchId } = await requireAuth({
    requireActiveStatus: true,
  });

  const [suppliers, shop] = await Promise.all([
    getSuppliers(shopId, branchId),
    prisma.shop.findUnique({
      where: { id: shopId },
      select: { currencySymbol: true },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <SuppliersClient
        data={suppliers}
        currencySymbol={shop?.currencySymbol || "$"}
      />
    </div>
  );
}