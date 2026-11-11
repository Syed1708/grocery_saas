import { requireAuth } from "@/lib/auth/guard";
import { IPurchaseOrder, PERMISSIONS } from "@/types";
import { getPurchaseOrders, getPurchases } from "@/queries/purchase-queries";
import { getSuppliers } from "@/queries/supplier-queries";
import { prisma } from "@/lib/prisma";
import { IPurchase } from "@/types/purchase";
import { ISupplier } from "@/types";
import PurchasesClient from "./_components/PurchaseClient";
import { getPurchaseReturns } from "@/queries/purchase-return";
import { IPurchaseReturn } from "@/types/purchase-return";

export default async function PurchasesPage() {
  // 🛡️ Zero-Trust Guard: Enforce permissions and active status
  const user = await requireAuth({
    requiredPermission: PERMISSIONS.CATALOG_MANAGE,
    requireActiveStatus: true,
  });

  const { shopId, activeBranchId, role } = user;

  // Parallel server queries (Strictly scoped to active branch)
  const [purchases, suppliers, returns, orders, shop] = await Promise.all([
    getPurchases(shopId, activeBranchId),
    getSuppliers(shopId, activeBranchId),
    getPurchaseReturns(shopId, activeBranchId),
        getPurchaseOrders(shopId, activeBranchId), // 👈 Fetch orders

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
        returns={returns as IPurchaseReturn[]} // 👈 Pass returns prop
        orders={orders as IPurchaseOrder[]} // 👈 Pass orders prop
        currencySymbol={shop?.currencySymbol || "৳"}
        shopName={shop?.name || "Grocery Store"}
        userRole={role}
      />
    </div>
  );
}