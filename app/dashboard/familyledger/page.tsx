import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

import FamilyLedgerClient from "./_components/FamilyLedgerClient";
import { getPartnerRations, getPartners, getPartnerTransactions } from "@/queries/partner-queries";

export default async function FamilyLedgerPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.shopId) {
    redirect("/login");
  }

  // Zero-Trust Security: Family Ledger is strictly locked to OWNER
  if (session.user.role !== "OWNER") {
    redirect("/dashboard");
  }

  const shopId = session.user.shopId as string;
  const branchId = session.user.branchId || undefined;

  // Parallel data fetching matching your AccountsPage pattern
  const [partnersRes, transactionsRes, rationsRes, accountsRaw, productsRaw, shop] = await Promise.all([
    getPartners(),
    getPartnerTransactions(100),
    getPartnerRations(100),
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
  const partners = partnersRes.data || [];
  const transactions = transactionsRes.data || [];
  const rations = rationsRes.data || [];

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