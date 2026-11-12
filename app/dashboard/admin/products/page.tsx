import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import { prisma } from "@/lib/prisma";
import {
  getProducts,
  getCategoriesForSelect,
  getUnitsForSelect,
  getBrandsForSelect,
  getSectionsForSelect,
} from "@/queries/product-queries";
import ProductsClient from "./_components/ProductsClient";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    view?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  // 🛡️ Zero-Trust Guard: Enforce permissions and active account status
  const user = await requireAuth({
    requiredPermission: PERMISSIONS.CATALOG_VIEW,
    requireActiveStatus: true,
  });

  const { shopId, activeBranchId, role } = user;
  const { search, view } = await searchParams;

  // Parallel server queries scoped strictly to activeBranchId (Zero `any`)
  const [products, categories, units, brands, sections, shop] =
    await Promise.all([
      getProducts(shopId, activeBranchId), // 👈 Already returns full IProduct[] with stockQuantity!
      getCategoriesForSelect(shopId),
      getUnitsForSelect(shopId),
      getBrandsForSelect(shopId),
      getSectionsForSelect(shopId),
      prisma.shop.findUnique({
        where: { id: shopId },
        select: { currencySymbol: true, name: true },
      }),
    ]);

  return (
    <div className="max-w-7xl mx-auto">
      <ProductsClient
        data={products}
        categories={categories}
        brands={brands}
        sections={sections}
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