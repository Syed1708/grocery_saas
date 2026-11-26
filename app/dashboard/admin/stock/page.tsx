import { requireAuth } from "@/lib/auth/guard";// 👈 Add import
import { prisma } from "@/lib/prisma";
import { getStockTransfers } from "@/queries/stock-transfer-queries";
import { getStockWastages } from "@/queries/stock-wastage-queries";
import { getSuppliers } from "@/queries/supplier-queries";
import { PERMISSIONS } from "@/types";
import StockClient from "./_components/StockClient";

const PAGE_SIZES = [10, 20, 50, 100];
const DIRECTIONS = ["IN_TRANSIT", "INBOUND", "OUTBOUND"];
const WASTAGE_REASONS = [
  "ROTTEN_PERISHABLE",
  "BROKEN_DAMAGED",
  "EXPIRED_NO_RETURN",
  "PEST_DAMAGE",
  "INTERNAL_STORE_USE",
  "OTHER",
];

function parsePage(value: string | undefined): number {
  const page = Number(value);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

export default async function StockOperationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    pageSize?: string;
    wastagesQ?: string;
    wastagesReason?: string;
    wastagesPage?: string;
    transfersQ?: string;
    transfersDirection?: string;
    transfersPage?: string;
  }>;
}) {
  const user = await requireAuth({
    requiredAnyPermission: [PERMISSIONS.INVENTORY_TRANSFER, PERMISSIONS.INVENTORY_WASTAGE],
    requireActiveStatus: true,
  });

  const { shopId, activeBranchId, role } = user;
  const rawFilters = await searchParams;
  const parsedPageSize = Number(rawFilters.pageSize);
  const pageSize = PAGE_SIZES.includes(parsedPageSize) ? parsedPageSize : 10;
  const wastagesPage = parsePage(rawFilters.wastagesPage);
  const transfersPage = parsePage(rawFilters.transfersPage);
  const wastagesReason =
    rawFilters.wastagesReason && WASTAGE_REASONS.includes(rawFilters.wastagesReason)
      ? rawFilters.wastagesReason
      : undefined;
  const transfersDirection =
    rawFilters.transfersDirection && DIRECTIONS.includes(rawFilters.transfersDirection)
      ? rawFilters.transfersDirection
      : undefined;

  // Parallel server queries
  const [wastagesResult, transfersResult, branches, suppliers, products, shop] = await Promise.all([
    getStockWastages(
      shopId,
      activeBranchId,
      { q: rawFilters.wastagesQ, reason: wastagesReason },
      wastagesPage,
      pageSize
    ),
    getStockTransfers(
      shopId,
      activeBranchId,
      { q: rawFilters.transfersQ, direction: transfersDirection },
      transfersPage,
      pageSize
    ),
    prisma.branch.findMany({
      where: { shopId, status: "active" },
      select: { id: true, name: true, isMain: true },
    }),
    getSuppliers(shopId, activeBranchId),
    prisma.product.findMany({
      where: { shopId, status: "active" },
      select: {
        id: true,
        name: true,
        barcode: true,
        purchasePrice: true,
        brand: { select: { name: true } },
        unit: { select: { shortCode: true } },
        stocks: {
          where: { branchId: activeBranchId },
          select: { quantity: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.shop.findUnique({
      where: { id: shopId },
      select: { currencySymbol: true, name: true },
    }),
  ]);

  const formattedProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    barcode: p.barcode || "",
    brandName: p.brand?.name || "",
    unitCode: p.unit?.shortCode || "pcs",
    costPrice: Number(p.purchasePrice || 0),
    stockQuantity: Number(p.stocks[0]?.quantity || 0),
  }));

  return (
    <div className="max-w-7xl mx-auto">
      <StockClient
        wastages={wastagesResult.items}
        wastageTotal={wastagesResult.total}
        wastagesPage={wastagesResult.page}
        transfers={transfersResult.items} // 👈 Pass transfers
        transferTotal={transfersResult.total}
        transfersPage={transfersResult.page}
        pageSize={pageSize}
        branches={branches}   // 👈 Pass branches
        currentBranchId={activeBranchId}
        suppliers={suppliers}
        products={formattedProducts}
        currencySymbol={shop?.currencySymbol || "৳"}
        shopName={shop?.name || "Grocery Store"}
        userRole={role}
      />
    </div>
  );
}