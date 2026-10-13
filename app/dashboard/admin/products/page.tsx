import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { redirect } from "next/navigation";
import {
  getProducts,
  getCategoriesForSelect,
  getUnitsForSelect,
  getBrandsForSelect,
  getSectionsForSelect,
} from "@/queries/product-queries";
import ProductsClient from "./_components/ProductsClient";
import { prisma } from "@/lib/prisma";

export default async function ProductsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.shopId) {
    redirect("/login");
  }

  const { shopId, branchId } = session.user;

  // 🚀 Fast parallel queries for all catalog elements
  const [products, categories, units, brands, sections, shop] = await Promise.all([
    getProducts(shopId, branchId),
    getCategoriesForSelect(shopId),
    getUnitsForSelect(shopId),
    getBrandsForSelect(shopId),
    getSectionsForSelect(shopId),
    prisma.shop.findUnique({
      where: { id: shopId },
            select: { currencySymbol: true, name: true }, // 👈 Include store name
    }),
  ]);

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
      />
    </div>
  );
}