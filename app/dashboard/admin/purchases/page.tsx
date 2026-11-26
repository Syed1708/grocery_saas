import { requireAuth } from "@/lib/auth/guard";
import { IPurchaseOrder, PERMISSIONS } from "@/types";
import { getPurchaseOrders, getPurchases } from "@/queries/purchase-queries";
import { getSuppliers } from "@/queries/supplier-queries";
import { prisma } from "@/lib/prisma";
import { IPurchase } from "@/types/purchase";
import { ISupplier } from "@/types";
import PurchasesClient from "./_components/PurchaseClient";
import { getPurchaseReturns } from "@/queries/purchase-return";
import { IPurchaseReturn } from "@/types/purchase-return";

interface PageProps {
  searchParams: Promise<{
    supplierId?: string;
    purchaseId?: string;
    q?: string;
    status?: string;
    page?: string;
    pageSize?: string;
  }>;
}

const PAGE_SIZES = [10, 20, 50, 100];
const PAYMENT_STATUSES = ["PAID", "PARTIAL", "DUE"];

function parsePage(value: string | undefined): number {
  const page = Number(value);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

export default async function PurchasesPage({ searchParams }: PageProps) {
  // 🛡️ Zero-Trust Guard: Enforce permissions and active status
  const user = await requireAuth({
    requiredPermission: PERMISSIONS.PURCHASES_VIEW,
    requireActiveStatus: true,
  });

  const { shopId, activeBranchId, role } = user;
  const rawFilters = await searchParams;
  const { supplierId } = rawFilters;
  const parsedPageSize = Number(rawFilters.pageSize);
  const pageSize = PAGE_SIZES.includes(parsedPageSize) ? parsedPageSize : 10;
  const page = parsePage(rawFilters.page);
  const status = rawFilters.status && PAYMENT_STATUSES.includes(rawFilters.status)
    ? rawFilters.status
    : undefined;

  // Parallel server queries (Strictly scoped to active branch)
  const [purchasesResult, suppliers, returns, orders, shop] = await Promise.all([
    getPurchases(shopId, activeBranchId, { q: rawFilters.q, status }, page, pageSize),
    getSuppliers(shopId, activeBranchId),
    getPurchaseReturns(shopId, activeBranchId),
        getPurchaseOrders(shopId, activeBranchId), // 👈 Fetch orders

    prisma.shop.findUnique({
      where: { id: shopId },
      select: { currencySymbol: true, name: true },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <PurchasesClient
        purchases={purchasesResult.items as IPurchase[]}
        invoiceTotal={purchasesResult.total}
        invoicePage={purchasesResult.page}
        invoicePageSize={purchasesResult.pageSize}
        suppliers={suppliers as ISupplier[]}
        returns={returns as IPurchaseReturn[]} // 👈 Pass returns prop
        orders={orders as IPurchaseOrder[]} // 👈 Pass orders prop
        currencySymbol={shop?.currencySymbol || "৳"}
        shopName={shop?.name || "Grocery Store"}
        userRole={role}
        initialSupplierId={supplierId}
      />
    </div>
  );
}