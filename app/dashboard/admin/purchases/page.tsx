import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { redirect } from "next/navigation";
import { getPurchases } from "@/queries/purchase-queries";
import { getSuppliersForSelect } from "@/queries/supplier-queries";
import { getProducts } from "@/queries/product-queries";
import PurchasesClient from "./_components/PurchasesClient";
import { prisma } from "@/lib/prisma";

export default async function PurchasesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.shopId) {
    redirect("/login");
  }

  const { shopId, branchId } = session.user;

  // Parallel server queries
  const [purchases, products, suppliers, shop] = await Promise.all([
    getPurchases(shopId, branchId), // 👈 Filters purchases to active branch
    getProducts(shopId, branchId),
    getSuppliersForSelect(shopId),
    prisma.shop.findUnique({
      where: { id: shopId },
      select: { currencySymbol: true },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <PurchasesClient
        data={purchases}
        products={products}
        suppliers={suppliers}
        currencySymbol={shop?.currencySymbol || "৳"}
      />
    </div>
  );
}