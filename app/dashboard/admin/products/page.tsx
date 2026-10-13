import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { redirect } from "next/navigation";
import {
  getProducts,
  getCategoriesForSelect,
  getUnitsForSelect,
} from "@/queries/product-queries";
import ProductsClient from "./_components/ProductsClient";
import { prisma } from "@/lib/prisma";

export default async function ProductsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.shopId) {
    redirect("/login");
  }

  const { shopId } = session.user;

  // Parallel server queries for fast page loading
  const [products, categories, units, shop] = await Promise.all([
    getProducts(shopId),
    getCategoriesForSelect(shopId),
    getUnitsForSelect(shopId),
    prisma.shop.findUnique({
      where: { id: shopId },
      select: { currencySymbol: true },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <ProductsClient
        data={products}
        categories={categories}
        units={units}
        currencySymbol={shop?.currencySymbol || "$"}
      />
    </div>
  );
}