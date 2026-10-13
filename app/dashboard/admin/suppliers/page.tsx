import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { redirect } from "next/navigation";
import { getSuppliers } from "@/queries/supplier-queries";
import SuppliersClient from "./_components/SuppliersClient";
import { prisma } from "@/lib/prisma";

export default async function SuppliersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.shopId) {
    redirect("/login");
  }

  const { shopId } = session.user;

  const [suppliers, shop] = await Promise.all([
    getSuppliers(shopId),
    prisma.shop.findUnique({
      where: { id: shopId },
      select: { currencySymbol: true },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <SuppliersClient
        data={suppliers}
        currencySymbol={shop?.currencySymbol || "$"}
      />
    </div>
  );
}