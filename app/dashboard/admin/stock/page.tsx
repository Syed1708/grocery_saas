import { requireAuth } from "@/lib/auth/guard";// 👈 Add import
import { prisma } from "@/lib/prisma";
import { getStockTransfers } from "@/queries/stock-transfer-queries";
import { getStockWastages } from "@/queries/stock-wastage-queries";
import { getSuppliers } from "@/queries/supplier-queries";
import { PERMISSIONS } from "@/types";
import StockClient from "./_components/StockClient";

export default async function StockOperationsPage() {
  const user = await requireAuth({
    requiredPermission: PERMISSIONS.CATALOG_MANAGE,
    requireActiveStatus: true,
  });

  const { shopId, activeBranchId, role } = user;

  // Parallel server queries
  const [wastages, transfers, branches, suppliers, products, shop] = await Promise.all([
    getStockWastages(shopId, activeBranchId),
    getStockTransfers(shopId, activeBranchId), // 👈 Fetch transfers
    prisma.branch.findMany({
      where: { shopId, status: "active" },
      select: { id: true, name: true, isMain: true },
    }),
    getSuppliers(shopId, activeBranchId),
    prisma.product.findMany({
      where: { shopId, status: "active" },
      select: {
        id: true,
        name: true,
        barcode: true,
        purchasePrice: true,
        brand: { select: { name: true } },
        unit: { select: { shortCode: true } },
        stocks: {
          where: { branchId: activeBranchId! },
          select: { quantity: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.shop.findUnique({
      where: { id: shopId },
      select: { currencySymbol: true, name: true },
    }),
  ]);

  const formattedProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    barcode: p.barcode || "",
    brandName: p.brand?.name || "",
    unitCode: p.unit?.shortCode || "pcs",
    costPrice: Number(p.purchasePrice || 0),
    stockQuantity: Number(p.stocks[0]?.quantity || 0),
  }));

  return (
    <div className="max-w-7xl mx-auto">
      <StockClient
        wastages={wastages}
        transfers={transfers} // 👈 Pass transfers
        branches={branches}   // 👈 Pass branches
        currentBranchId={activeBranchId!}
        suppliers={suppliers as any}
        products={formattedProducts}
        currencySymbol={shop?.currencySymbol || "৳"}
        shopName={shop?.name || "Grocery Store"}
        userRole={role}
      />
    </div>
  );
}