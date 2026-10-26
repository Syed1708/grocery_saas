import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPastClosings, getCurrentShiftSummary } from "@/queries/closing-queries";
import ClosingsClient from "./_components/ClosingsClient";

export default async function ClosingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.shopId || !session?.user?.branchId) {
    redirect("/login");
  }

  const { shopId, branchId } = session.user;

  const [closings, shiftSummary, shop, branch] = await Promise.all([
    getPastClosings(shopId, branchId),
    getCurrentShiftSummary(shopId, branchId),
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
      <ClosingsClient
        data={closings}
        shiftSummary={shiftSummary}
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