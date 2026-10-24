import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { redirect } from "next/navigation";
import { getSales } from "@/queries/sale-queries";
import { prisma } from "@/lib/prisma";
import SalesClient from "./_components/SalesClient";

export default async function SalesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.shopId) {
    redirect("/login");
  }

  const { shopId, branchId } = session.user;

  const [sales, shop] = await Promise.all([
    getSales(shopId, branchId),
    prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        name: true,
        phone: true,
        address: true,
        currencySymbol: true,
        thermalWidth: true,
        invoiceFooter: true,
      },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <SalesClient
        data={sales}
        shop={shop}
        currencySymbol={shop?.currencySymbol || "৳"}
      />
    </div>
  );
}