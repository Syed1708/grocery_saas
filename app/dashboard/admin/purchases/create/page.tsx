// app/dashboard/admin/purchases/create/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSuppliers } from "@/queries/supplier-queries";
import { getProducts } from "@/queries/product-queries";
import CreatePurchaseClient from "../_components/CreatePurchaseClient";

export default async function CreatePurchasePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.shopId) {
    redirect("/login");
  }

  const { shopId, branchId } = session.user;

  // 1. Fetch products, suppliers, active branch & shop info in parallel
  const [products, suppliers, activeBranch, shop] = await Promise.all([
    getProducts(shopId, branchId),
    getSuppliers(shopId),
    branchId
      ? prisma.branch.findUnique({ where: { id: branchId }, select: { name: true, code: true } })
      : prisma.branch.findFirst({ where: { shopId, isMain: true }, select: { name: true, code: true } }),
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