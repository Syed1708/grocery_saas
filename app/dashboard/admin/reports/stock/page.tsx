import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { redirect } from "next/navigation";
import { getStockValuationReport } from "@/queries/report-queries";
import { prisma } from "@/lib/prisma";
import StockReportClient from "./_components/StockReportClient";

export default async function StockReportPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.shopId) {
    redirect("/login");
  }

  const { shopId, branchId } = session.user;

  const [items, shop] = await Promise.all([
    getStockValuationReport(shopId, branchId),
    prisma.shop.findUnique({
      where: { id: shopId },
      select: { currencySymbol: true },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <StockReportClient
        data={items}
        currencySymbol={shop?.currencySymbol || "৳"}
      />
    </div>
  );
}