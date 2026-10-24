import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCustomerDueReportData } from "@/queries/customer-due-queries";
import CustomersDueClient from "./_components/customers-due-client";

interface PageProps {
  searchParams: Promise<{ search?: string; type?: string; aging?: string }>;
}

export default async function CustomerDueReportPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.shopId) {
    redirect("/login");
  }

  const { shopId } = session.user;
  const { search, type, aging } = await searchParams;

  const [data, shop] = await Promise.all([
    getCustomerDueReportData(shopId, search, type, aging),
    prisma.shop.findUnique({
      where: { id: shopId },
      select: { name: true, currencySymbol: true },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <CustomersDueClient
        kpis={data.kpis}
        customers={data.customers}
        currencySymbol={shop?.currencySymbol || "৳"}
        shopName={shop?.name || "Grocery ERP"}
      />
    </div>
  );
}