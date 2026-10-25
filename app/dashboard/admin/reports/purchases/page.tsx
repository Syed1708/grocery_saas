import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPurchaseReportData } from "@/queries/purchase-report-queries";
import PurchaseReportClient from "./_components/PurchaseReportClient";
import { IPurchaseFilterParams } from "@/types/purchases";

interface PageProps {
  searchParams: Promise<IPurchaseFilterParams>;
}

export default async function PurchaseReportPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.shopId || !session?.user?.branchId) {
    redirect("/login");
  }

  const { shopId, branchId } = session.user;
  const filters = await searchParams;

  const [purchaseData, suppliers, shop, branch] = await Promise.all([
    getPurchaseReportData(shopId, branchId, filters),
    prisma.supplier.findMany({
      where: { shopId, status: "active" },
      select: { id: true, name: true, companyName: true },
    }),
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
      <PurchaseReportClient
        kpis={purchaseData.kpis}
        rows={purchaseData.rows}
        currencySymbol={shop?.currencySymbol || "৳"}
        suppliers={suppliers}
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