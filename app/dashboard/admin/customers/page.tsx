import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { redirect } from "next/navigation";
import { getCustomers } from "@/queries/customer-queries";
import CustomersClient from "./_components/CustomersClient";
import { prisma } from "@/lib/prisma";

export default async function CustomersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.shopId) {
    redirect("/login");
  }

  const { shopId, branchId } = session.user;

  const [customers, shop] = await Promise.all([
    getCustomers(shopId, branchId),
    prisma.shop.findUnique({
      where: { id: shopId },
      select: { currencySymbol: true },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <CustomersClient
        data={customers}
        currencySymbol={shop?.currencySymbol || "$"}
      />
    </div>
  );
}