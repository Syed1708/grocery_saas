import { prisma } from "@/lib/prisma";
import {
  IFamilyReportData,
  IFamilyReportFilters,
  IFamilyReportPartnerRow,
  IPartnerRation,
  IPartnerTransaction,
  PartnerRelationship,
  PartnerTransactionType,
} from "@/types/partner";

/**
 * Family Ledger report — all figures scoped to the active branch.
 */
export async function getFamilyReportData(
  shopId: string,
  branchId: string,
  filters: IFamilyReportFilters = {}
): Promise<IFamilyReportData> {
  const start = filters.startDate ? new Date(`${filters.startDate}T00:00:00`) : undefined;
  const end = filters.endDate ? new Date(`${filters.endDate}T23:59:59.999`) : undefined;
  const dateRange = start || end ? { gte: start, lte: end } : undefined;
  const partnerFilter = filters.partnerId ? { partnerId: filters.partnerId } : {};

  const [rawPartners, rawTransactions, rawRations] = await Promise.all([
    prisma.partner.findMany({
      where: {
        shopId,
        status: "active",
        ...(filters.partnerId ? { id: filters.partnerId } : {}),
      },
      include: {
        transactions: {
          where: {
            branchId,
            ...partnerFilter,
            ...(dateRange ? { transactionDate: dateRange } : {}),
          },
          select: { amount: true, type: true },
        },
        rations: {
          where: {
            branchId,
            ...partnerFilter,
            ...(dateRange ? { rationDate: dateRange } : {}),
          },
          select: { totalCost: true },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.partnerTransaction.findMany({
      where: {
        shopId,
        branchId,
        ...partnerFilter,
        ...(dateRange ? { transactionDate: dateRange } : {}),
      },
      take: 500,
      orderBy: { transactionDate: "desc" },
      include: {
        partner: { select: { name: true } },
        account: { select: { name: true } },
      },
    }),
    prisma.partnerRation.findMany({
      where: {
        shopId,
        branchId,
        ...partnerFilter,
        ...(dateRange ? { rationDate: dateRange } : {}),
      },
      take: 500,
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
    }),
  ]);

  const partners: IFamilyReportPartnerRow[] = rawPartners.map((p) => {
    let injections = 0;
    let drawings = 0;

    for (const t of p.transactions) {
      const amount = Number(t.amount);
      if (t.type === "CAPITAL_INJECTION") injections += amount;
      else drawings += amount;
    }

    const rations = p.rations.reduce((sum, r) => sum + Number(r.totalCost), 0);
    const opening = Number(p.openingCapital);

    return {
      id: p.id,
      name: p.name,
      relationship: p.relationship as PartnerRelationship,
      equityPercent: Number(p.equityPercent),
      openingCapital: opening,
      injections,
      drawings,
      rations,
      netEquity: opening + injections - drawings - rations,
    };
  });

  const kpis = partners.reduce(
    (acc, p) => ({
      openingCapital: acc.openingCapital + p.openingCapital,
      injections: acc.injections + p.injections,
      drawings: acc.drawings + p.drawings,
      rations: acc.rations + p.rations,
      netEquity: acc.netEquity + p.netEquity,
    }),
    { openingCapital: 0, injections: 0, drawings: 0, rations: 0, netEquity: 0 }
  );

  const transactions: IPartnerTransaction[] = rawTransactions.map((t) => ({
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

  const rations: IPartnerRation[] = rawRations.map((r) => ({
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

  return { kpis, partners, transactions, rations };
}
