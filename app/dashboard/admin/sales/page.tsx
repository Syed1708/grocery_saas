import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import { getSales } from "@/queries/sale-queries";
import { prisma } from "@/lib/prisma";
import SalesClient from "./_components/SalesClient";
import { IPosShopConfig } from "@/types/sale";

export default async function SalesPage() {
  const user = await requireAuth({
    requiredPermission: PERMISSIONS.POS_ACCESS,
    requireActiveStatus: true,
  });

  const { shopId, activeBranchId } = user;

  // 👈 FIX: Strictly filter by activeBranchId for everyone (including OWNER
  const [sales, rawShop] = await Promise.all([
    getSales(shopId, activeBranchId),
    prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        name: true,
        phone: true,
        address: true,
        currencySymbol: true,
        thermalWidth: true,
        invoiceHeader: true,
        invoiceFooter: true,
      },
    }),
  ]);

  if (!rawShop) {
    redirect("/dashboard");
  }

  const shop: IPosShopConfig = {
    name: rawShop.name,
    phone: rawShop.phone,
    address: rawShop.address,
    currencySymbol: rawShop.currencySymbol || "৳",
    enableVat: false,
    vatPercent: 0,
    thermalWidth: rawShop.thermalWidth || "80mm",
    invoiceHeader: rawShop.invoiceHeader,
    invoiceFooter: rawShop.invoiceFooter,
  };

  // 👈 Pass sales directly to SalesClient without double-mapping!
  return (
    <div className="max-w-7xl mx-auto">
      <SalesClient
        data={sales}
        shop={shop}
        currencySymbol={shop.currencySymbol}
        userRole={user.role} // 👈 OWNER ONLY
      />
    </div>
  );
}