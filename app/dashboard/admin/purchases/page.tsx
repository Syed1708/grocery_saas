// app/dashboard/admin/purchases/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { redirect } from "next/navigation";
import { getPurchases } from "@/queries/purchase-queries";
import { getSuppliers } from "@/queries/supplier-queries";
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
    getPurchases(shopId, branchId),
    getProducts(shopId, branchId),
    getSuppliers(shopId), // 👈 Fetch full supplier directory
    prisma.shop.findUnique({
      where: { id: shopId },
      select: { currencySymbol: true, name: true },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <PurchasesClient
        purchases={purchases as any}
        suppliers={suppliers as any}
        products={products as any}
        currencySymbol={shop?.currencySymbol || "৳"}
        shopName={shop?.name || "Grocery Store"}
      />
    </div>
  );
}