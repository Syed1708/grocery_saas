import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { redirect } from "next/navigation";
import { getPosCatalog } from "@/queries/sale-queries";
import { getCustomers } from "@/queries/customer-queries";
import { getCategoriesForSelect } from "@/queries/product-queries";
import { prisma } from "@/lib/prisma";
import PosTerminalView from "./_components/PosTerminalView";

export default async function PosPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.shopId) {
    redirect("/login");
  }

  const { shopId, branchId, name, branchName } = session.user;

  // Fast parallel queries
  const [catalog, customers, categories, rawShop] = await Promise.all([
    getPosCatalog(shopId, branchId),
    getCustomers(shopId),
    getCategoriesForSelect(shopId),
    prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        name: true,
        phone: true,
        address: true,
        currencySymbol: true,
        enableVat: true,
        vatPercent: true,
        thermalWidth: true,
        invoiceHeader: true,
        invoiceFooter: true,
      },
    }),
  ]);

  // 👈 Serialize Prisma Decimal objects to plain JSON numbers/strings
  const shop = rawShop ? JSON.parse(JSON.stringify(rawShop)) : null;

  return (
    <PosTerminalView
      catalog={catalog}
      customers={customers}
      categories={categories}
      shop={shop}
      cashierName={name || "Cashier"}
      branchName={branchName || "Main Branch"}
    />
  );
}