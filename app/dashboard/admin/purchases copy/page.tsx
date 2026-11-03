import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import { getPurchases } from "@/queries/purchase-queries";
import { getSuppliers } from "@/queries/supplier-queries";
import { prisma } from "@/lib/prisma";
import PurchasesClient from "./_components/PurchasesClient";
import { IPurchase } from "@/types/purchase";
import { ISupplier } from "@/types";

export default async function PurchasesPage() {
  // 🛡️ Zero-Trust Guard: Enforce permissions and active status
  const user = await requireAuth({
    requiredPermission: PERMISSIONS.CATALOG_MANAGE,
    requireActiveStatus: true,
  });

  const { shopId, activeBranchId, role } = user;

  // Parallel server queries (Strictly scoped to active branch)
  const [purchases, suppliers, shop] = await Promise.all([
    getPurchases(shopId, activeBranchId),
    getSuppliers(shopId),
    prisma.shop.findUnique({
      where: { id: shopId },
      select: { currencySymbol: true, name: true },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <PurchasesClient
        purchases={purchases as IPurchase[]}
        suppliers={suppliers as ISupplier[]}
        currencySymbol={shop?.currencySymbol || "৳"}
        shopName={shop?.name || "Grocery Store"}
        userRole={role}
      />
    </div>
  );
}