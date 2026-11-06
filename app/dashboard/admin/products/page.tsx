import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import { prisma } from "@/lib/prisma";
import { getBrandsForSelect, getProducts, getSectionsForSelect, getUnitsForSelect } from "@/queries/product-queries";
import { getCategoriesForSelect } from "@/queries/product-queries";
import ProductsClient from "./_components/ProductsClient";
import { IProduct } from "@/types";

interface PageProps {
  searchParams: Promise<{ search?: string; view?: string }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  // 🛡️ Zero-Trust Guard: Enforce permissions and active status
  const user = await requireAuth({
    requiredPermission: PERMISSIONS.CATALOG_VIEW,
    requireActiveStatus: true,
  });

  const { shopId, activeBranchId, role } = user;
  const { search, view } = await searchParams;

  // Parallel server queries scoped strictly to activeBranchId
  const [rawProducts, categories, units, brands, sections, shop] = await Promise.all([
    getProducts(shopId, activeBranchId),
    getCategoriesForSelect(shopId),
    getUnitsForSelect(shopId),
    getBrandsForSelect(shopId),
    getSectionsForSelect(shopId),
    prisma.shop.findUnique({
      where: { id: shopId },
      select: { currencySymbol: true, name: true },
    }),
  ]);

  // Safe Decimal-to-Number mapping
  const products: IProduct[] = (rawProducts || []).map((p: any) => ({
    ...p,
    costPrice: Number(p.purchasePrice ?? p.costPrice ?? 0),
    sellingPrice: Number(p.sellingPrice ?? 0),
    wholesalePrice: p.wholesalePrice ? Number(p.wholesalePrice) : null,
    stockQuantity: Number(p.stocks?.[0]?.quantity ?? p.stockQuantity ?? 0),
    minStockAlert: Number(p.alertQuantity ?? p.minStockAlert ?? 5),
    vatPercent: Number(p.vatPercent ?? 0),
    conversionFactor: Number(p.conversionFactor ?? 1),
    unitCode: p.unit?.shortCode || p.unitCode || "pcs",
  }));

  return (
    <div className="max-w-7xl mx-auto">
      <ProductsClient
        data={products}
        categories={categories}
        brands={brands as any}
        sections={sections as any}
        units={units}
        currencySymbol={shop?.currencySymbol || "৳"}
        shopName={shop?.name || "Grocery Store"}
        userRole={role}
        initialSearch={search || ""}
        autoViewBarcode={view || search || ""}
      />
    </div>
  );
}