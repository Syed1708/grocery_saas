import { requireAuth } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/types";
import { PartnerTransactionType } from "@/types/partner";

import FamilyLedgerClient from "./_components/FamilyLedgerClient";
import { getPartnerRations, getPartners, getPartnerTransactions } from "@/queries/partner-queries";

interface PageProps {
  searchParams: Promise<{
    startDate?: string;
    endDate?: string;
    partnerId?: string;
    type?: string;
    tab?: string;
    pageSize?: string;
    drawingsPage?: string;
    rationsPage?: string;
  }>;
}

const TRANSACTION_TYPES: PartnerTransactionType[] = [
  "CASH_DRAWING",
  "BANK_DRAWING",
  "HOUSEHOLD_EXPENSE",
  "CAPITAL_INJECTION",
  "PROFIT_DISTRIBUTION",
];
const PAGE_SIZES = [10, 20, 50, 100];

function parsePage(value: string | undefined): number {
  const page = Number(value);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

export default async function FamilyLedgerPage({ searchParams }: PageProps) {
  const { shopId, activeBranchId: branchId } = await requireAuth({
    requiredPermission: PERMISSIONS.FAMILY_LEDGER_ACCESS,
    requireActiveStatus: true,
  });

  const rawFilters = await searchParams;
  const type = TRANSACTION_TYPES.includes(rawFilters.type as PartnerTransactionType)
    ? (rawFilters.type as PartnerTransactionType)
    : undefined;
  const filters = {
    startDate: rawFilters.startDate,
    endDate: rawFilters.endDate,
    partnerId: rawFilters.partnerId,
    type,
  };
  const parsedPageSize = Number(rawFilters.pageSize);
  const pageSize = PAGE_SIZES.includes(parsedPageSize) ? parsedPageSize : 10;
  const drawingsPage = parsePage(rawFilters.drawingsPage);
  const rationsPage = parsePage(rawFilters.rationsPage);

  // Parallel data fetching matching your AccountsPage pattern
  const [partners, transactionsResult, rationsResult, accountsRaw, productsRaw, shop, branch] = await Promise.all([
    getPartners(shopId, branchId),
    getPartnerTransactions(shopId, branchId, filters, drawingsPage, pageSize),
    getPartnerRations(shopId, branchId, filters, rationsPage, pageSize),
    prisma.account.findMany({
      where: { 
        shopId, 
        status: "active",
        ...(branchId ? { branchId } : {}),
      },
      select: { id: true, name: true, type: true, currentBalance: true },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: { shopId, status: "active" },
      select: { id: true, name: true, sku: true, purchasePrice: true },
      orderBy: { name: "asc" },
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

  // Safe unpack and Decimal-to-Number conversion for client components
  const accounts = accountsRaw.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    currentBalance: Number(a.currentBalance),
  }));

  const products = productsRaw.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    purchasePrice: Number(p.purchasePrice),
  }));

  return (
    <div className="max-w-7xl mx-auto">
      <FamilyLedgerClient
        partners={partners}
        transactions={transactionsResult.items}
        rations={rationsResult.items}
        transactionTotal={transactionsResult.total}
        rationTotal={rationsResult.total}
        drawingsPage={transactionsResult.page}
        rationsPage={rationsResult.page}
        pageSize={pageSize}
        accounts={accounts}
        products={products}
        currencySymbol={shop?.currencySymbol || "৳"}
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