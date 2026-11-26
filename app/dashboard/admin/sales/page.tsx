import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import { getSales } from "@/queries/sale-queries";
import { prisma } from "@/lib/prisma";
import SalesClient from "./_components/SalesClient";
import { IPosShopConfig } from "@/types/sale";

const PAGE_SIZES = [10, 20, 50, 100];

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    method?: string;
    page?: string;
    pageSize?: string;
  }>;
}

function parsePage(value: string | undefined): number {
  const page = Number(value);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

export default async function SalesPage({ searchParams }: PageProps) {
  const user = await requireAuth({
    requiredPermission: PERMISSIONS.POS_ACCESS,
    requireActiveStatus: true,
  });

  const { shopId, activeBranchId } = user;
  const rawFilters = await searchParams;
  const parsedPageSize = Number(rawFilters.pageSize);
  const pageSize = PAGE_SIZES.includes(parsedPageSize) ? parsedPageSize : 10;
  const page = parsePage(rawFilters.page);
  const filters = {
    q: rawFilters.q,
    status: rawFilters.status,
    method: rawFilters.method,
  };

  // 👈 FIX: Strictly filter by activeBranchId for everyone (including OWNER)
  const [salesResult, rawShop] = await Promise.all([
    getSales(shopId, activeBranchId, filters, page, pageSize),
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
        data={salesResult.items}
        total={salesResult.total}
        page={salesResult.page}
        pageSize={salesResult.pageSize}
        shop={shop}
        currencySymbol={shop.currencySymbol}
        userRole={user.role} // 👈 OWNER ONLY
      />
    </div>
  );
}