import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import { prisma } from "@/lib/prisma";
import PurchaseReturnForm from "../../_components/form/PurchaseReturnForm";
import { getSuppliers } from "@/queries/supplier-queries";

export default async function CreatePurchaseReturnPage() {
  // 🛡️ Zero-Trust Guard
  const user = await requireAuth({
    requiredPermission: PERMISSIONS.CATALOG_MANAGE,
    requireActiveStatus: true,
  });

  const { shopId, activeBranchId } = user;

  // Parallel Queries: Branch info, Suppliers, Products with active branch stocks, Shop settings
  const [branch, suppliers, productStocks, shop] = await Promise.all([
    prisma.branch.findUnique({
      where: { id: activeBranchId! },
      select: { name: true },
    }),
    getSuppliers(shopId, activeBranchId),
    prisma.productStock.findMany({
      where: { branchId: activeBranchId! },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            barcode: true,
            purchasePrice: true,
          },
        },
      },
    }),
    prisma.shop.findUnique({
      where: { id: shopId },
      select: { currencySymbol: true },
    }),
  ]);

  // Format products with active branch stock
  const formattedProducts = productStocks.map((ps) => ({
    id: ps.product.id,
    name: ps.product.name,
    barcode: ps.product.barcode,
    costPrice: Number(ps.product.purchasePrice || 0),
    stock: Number(ps.quantity || 0),
    stockQuantity: Number(ps.quantity || 0),
  }));

  return (
    <div className="max-w-7xl mx-auto">
      <PurchaseReturnForm
        products={formattedProducts}
        suppliers={suppliers as any}
        activeBranchName={branch?.name || "Main Branch"}
        currencySymbol={shop?.currencySymbol || "৳"}
      />
    </div>
  );
}