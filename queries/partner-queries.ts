import { prisma } from "@/lib/prisma";
import {
  IFamilyLedgerFilters,
  IPartner,
  IPartnerRation,
  IPartnerTransaction,
  PartnerRelationship,
  PartnerTransactionType,
} from "@/types/partner";

// ==========================================
// 1. PARTNERS WITH BRANCH-SCOPED BALANCES
// ==========================================
export async function getPartners(shopId: string, branchId: string): Promise<IPartner[]> {
  const rawPartners = await prisma.partner.findMany({
    where: { shopId, status: "active" },
    include: {
      transactions: {
        where: { branchId },
        select: { amount: true, type: true },
      },
      rations: {
        where: { branchId },
        select: { totalCost: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return rawPartners.map((p) => {
    let drawings = 0;
    let injections = 0;

    for (const t of p.transactions) {
      const amt = Number(t.amount);
      if (t.type === "CAPITAL_INJECTION") injections += amt;
      else drawings += amt;
    }

    const rations = p.rations.reduce((sum, r) => sum + Number(r.totalCost), 0);
    const opening = Number(p.openingCapital);

    return {
      id: p.id,
      name: p.name,
      relationship: p.relationship as PartnerRelationship,
      phone: p.phone,
      nidNumber: p.nidNumber,
      equityPercent: Number(p.equityPercent),
      openingCapital: opening,
      currentBalance: opening + injections - drawings - rations,
      monthlyAllowance: Number(p.monthlyAllowance),
      status: p.status,
      notes: p.notes,
      totalDrawings: drawings,
      totalRations: rations,
      totalInjections: injections,
      createdAt: p.createdAt,
    };
  });
}

// ==========================================
// 2. RECENT PARTNER TRANSACTIONS (ACTIVE BRANCH)
// ==========================================
export async function getPartnerTransactions(
  shopId: string,
  branchId: string,
  filters: IFamilyLedgerFilters = {}
): Promise<IPartnerTransaction[]> {
  const dateFilter =
    filters.startDate || filters.endDate
      ? {
          ...(filters.startDate
            ? { gte: new Date(`${filters.startDate}T00:00:00`) }
            : {}),
          ...(filters.endDate
            ? { lte: new Date(`${filters.endDate}T23:59:59.999`) }
            : {}),
        }
      : undefined;

  const raw = await prisma.partnerTransaction.findMany({
    where: {
      shopId,
      branchId,
      ...(filters.partnerId ? { partnerId: filters.partnerId } : {}),
      ...(filters.type ? { type: filters.type } : {}),
      ...(dateFilter ? { transactionDate: dateFilter } : {}),
    },
    orderBy: { transactionDate: "desc" },
    include: {
      partner: { select: { name: true } },
      account: { select: { name: true } },
    },
  });

  return raw.map((t) => ({
    id: t.id,
    voucherNo: t.voucherNo,
    type: t.type as PartnerTransactionType,
    amount: Number(t.amount),
    transactionDate: t.transactionDate,
    paymentMethod: t.paymentMethod,
    purpose: t.purpose,
    notes: t.notes,
    partnerId: t.partnerId,
    partnerName: t.partner.name,
    accountId: t.accountId,
    accountName: t.account?.name || "N/A",
    branchId: t.branchId,
  }));
}

// ==========================================
// 3. HOME GROCERY RATIONS (ACTIVE BRANCH)
// ==========================================
export async function getPartnerRations(
  shopId: string,
  branchId: string,
  filters: IFamilyLedgerFilters = {}
): Promise<IPartnerRation[]> {
  const dateFilter =
    filters.startDate || filters.endDate
      ? {
          ...(filters.startDate
            ? { gte: new Date(`${filters.startDate}T00:00:00`) }
            : {}),
          ...(filters.endDate
            ? { lte: new Date(`${filters.endDate}T23:59:59.999`) }
            : {}),
        }
      : undefined;

  const raw = await prisma.partnerRation.findMany({
    where: {
      shopId,
      branchId,
      ...(filters.partnerId ? { partnerId: filters.partnerId } : {}),
      ...(dateFilter ? { rationDate: dateFilter } : {}),
    },
    orderBy: { rationDate: "desc" },
    include: {
      partner: { select: { name: true } },
      items: {
        include: {
          product: { select: { name: true } },
          unit: { select: { name: true } },
        },
      },
    },
  });

  return raw.map((r) => ({
    id: r.id,
    rationNo: r.rationNo,
    rationDate: r.rationDate,
    totalCost: Number(r.totalCost),
    notes: r.notes,
    partnerId: r.partnerId,
    partnerName: r.partner.name,
    items: r.items.map((it) => ({
      id: it.id,
      productId: it.productId,
      productName: it.product.name,
      quantity: Number(it.quantity),
      unitCost: Number(it.unitCost),
      lineTotal: Number(it.lineTotal),
      unitName: it.unit?.name,
    })),
  }));
}
