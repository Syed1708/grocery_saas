import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getProfitLossData } from "@/queries/profit-loss-queries";
import ProfitLossClient from "./_components/ProfitLossClient";
import { IProfitLossFilterParams } from "@/types/profit-loss";

interface PageProps {
  searchParams: Promise<IProfitLossFilterParams>;
}

export default async function ProfitLossPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.shopId || !session?.user?.branchId) {
    redirect("/login");
  }

  const { shopId, branchId } = session.user;
  const filters = await searchParams;

  const [plData, shop, branch] = await Promise.all([
    getProfitLossData(shopId, branchId, filters),
    prisma.shop.findUnique({
      where: { id: shopId },
      select: { name: true, phone: true, address: true, currencySymbol: true },
    }),
    prisma.branch.findUnique({
      where: { id: branchId },
      select: { name: true },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <ProfitLossClient
        data={plData}
        currencySymbol={shop?.currencySymbol || "৳"}
        shop={{
          name: shop?.name || "Grocery ERP",
          phone: shop?.phone,
          address: shop?.address,
        }}
        branchName={branch?.name || "Main Branch"}
      />
    </div>
  );
}