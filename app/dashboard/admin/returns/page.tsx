import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { redirect } from "next/navigation";
import { getSaleReturns } from "@/queries/return-queries";
import { prisma } from "@/lib/prisma";
import ReturnsClient from "./_components/ReturnsClient";

export default async function ReturnsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.shopId) {
    redirect("/login");
  }

  const { shopId, branchId } = session.user;

  const [returns, shop] = await Promise.all([
    getSaleReturns(shopId, branchId),
    prisma.shop.findUnique({
      where: { id: shopId },
      select: { currencySymbol: true },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <ReturnsClient
        data={returns}
        shopId={shopId}
        currencySymbol={shop?.currencySymbol || "৳"}
      />
    </div>
  );
}