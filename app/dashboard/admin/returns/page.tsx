import { requireAuth } from "@/lib/auth/guard";
import { IPosShopConfig, PERMISSIONS } from "@/types";
import { getSaleReturns } from "@/queries/return-queries";
import { prisma } from "@/lib/prisma";
import ReturnsClient from "./_components/ReturnsClient";

export default async function ReturnsPage() {
  // 1. Zero-Trust Guard: Enforce permissions & active status
  const user = await requireAuth({
    requiredPermission: PERMISSIONS.POS_ACCESS,
    requireActiveStatus: true,
  });

  const { shopId, activeBranchId } = user;

  // 2. Fetch Returns scoped strictly to the active branch (already number-normalized)
  const [returns, rawShop] = await Promise.all([
    getSaleReturns(shopId, activeBranchId),
    prisma.shop.findUnique({
      where: { id: shopId },
      select: { name: true,
      phone: true,
      address: true,
      currencySymbol: true,
      thermalWidth: true,
      invoiceHeader: true,
      invoiceFooter: true, },
    }),
  ]);

  const shop: IPosShopConfig = {
  name: rawShop?.name || "GROCERY STORE",
  phone: rawShop?.phone || "",
  address: rawShop?.address || "",
  currencySymbol: rawShop?.currencySymbol || "৳",
  enableVat: false,
  vatPercent: 0,
  thermalWidth: rawShop?.thermalWidth || "80mm",
  invoiceHeader: rawShop?.invoiceHeader || null,
  invoiceFooter: rawShop?.invoiceFooter || null,
};

  return (
    <div className="max-w-7xl mx-auto">
      <ReturnsClient
        data={returns}
        shop={shop}
        currencySymbol={shop?.currencySymbol || "৳"}
      />
    </div>
  );
}