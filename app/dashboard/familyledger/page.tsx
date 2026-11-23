import { requireAuth } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/types";

import FamilyLedgerClient from "./_components/FamilyLedgerClient";
import { getPartnerRations, getPartners, getPartnerTransactions } from "@/queries/partner-queries";

export default async function FamilyLedgerPage() {
  const { shopId, activeBranchId: branchId } = await requireAuth({
    requiredPermission: PERMISSIONS.FAMILY_LEDGER_ACCESS,
    requireActiveStatus: true,
  });

  // Parallel data fetching matching your AccountsPage pattern
  const [partners, transactions, rations, accountsRaw, productsRaw, shop] = await Promise.all([
    getPartners(shopId, branchId),
    getPartnerTransactions(shopId, branchId, 100),
    getPartnerRations(shopId, branchId, 100),
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
      select: { currencySymbol: true },
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
        transactions={transactions}
        rations={rations}
        accounts={accounts}
        products={products}
        currencySymbol={shop?.currencySymbol || "৳"}
      />
    </div>
  );
}