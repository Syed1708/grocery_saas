import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import { prisma } from "@/lib/prisma";
import { getSuppliers } from "@/queries/supplier-queries";
import { getProducts } from "@/queries/product-queries";
import CreatePurchaseClient from "../_components/CreatePurchaseClient";

export default async function CreatePurchasePage() {
  // 🛡️ Zero-Trust Guard
  const user = await requireAuth({
    requiredPermission: PERMISSIONS.CATALOG_MANAGE,
    requireActiveStatus: true,
  });

  const { shopId, activeBranchId } = user;

  // Parallel queries scoped strictly to activeBranchId
  const [products, suppliers, activeBranch, shop] = await Promise.all([
    getProducts(shopId, activeBranchId),
    getSuppliers(shopId),
    prisma.branch.findUnique({
      where: { id: activeBranchId },
      select: { name: true, code: true },
    }),
    prisma.shop.findUnique({
      where: { id: shopId },
      select: { currencySymbol: true, name: true },
    }),
  ]);

  const autoChalan = `CHAL-${Date.now().toString().slice(-6)}`;

  return (
    <div className="max-w-7xl mx-auto">
      <CreatePurchaseClient
        products={products as any}
        suppliers={suppliers as any}
        activeBranchName={activeBranch?.name || "Main Branch"}
        currencySymbol={shop?.currencySymbol || "৳"}
        autoChalan={autoChalan}
      />
    </div>
  );
}