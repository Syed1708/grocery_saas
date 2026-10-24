import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSalesReportData } from "@/queries/sales-report-queries";
import { ISalesFilterParams } from "@/types/index";
import SalesReportClient from "./_component/sales-report-client";

interface PageProps {
  searchParams: Promise<ISalesFilterParams>;
}

export default async function SalesReportPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.shopId || !session?.user?.branchId) {
    redirect("/login");
  }

  const { shopId, branchId } = session.user;
  const filters = await searchParams;

  const [reportData, shop, branch] = await Promise.all([
    getSalesReportData(shopId, branchId, filters),
    prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        name: true,
        phone: true,
        email: true,
        address: true,
        binVatNumber: true,
        tradeLicense: true,
        currencySymbol: true,
      },
    }),
    prisma.branch.findUnique({
      where: { id: branchId },
      select: { name: true },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <SalesReportClient
        kpis={reportData.kpis}
        invoices={reportData.invoices}
        itemVelocity={reportData.itemVelocity}
        currencySymbol={shop?.currencySymbol || "৳"}
        filters={filters}
        shop={{
          name: shop?.name || "Grocery ERP",
          phone: shop?.phone,
          email: shop?.email,
          address: shop?.address,
          binVatNumber: shop?.binVatNumber,
          tradeLicense: shop?.tradeLicense,
        }}
        branchName={branch?.name || "Main Branch"}
      />
    </div>
  );
}