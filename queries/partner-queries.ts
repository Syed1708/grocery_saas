import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/guard";
import { IPartner, IPartnerTransaction, IPartnerRation } from "@/types/partner";

// ==========================================
// 1. GET ALL PARTNERS WITH COMPUTED DRAWINGS
// ==========================================
export async function getPartners(): Promise<{ success: boolean; data?: IPartner[]; error?: string }> {
  try {
    const user = await requireAuth();
    if (user.role !== "OWNER") {
      return { success: false, error: "Access Denied: Family Ledger is restricted to Owner." };
    }

    const rawPartners = await prisma.partner.findMany({
      where: { shopId: user.shopId, status: "active" },
      include: {
        transactions: { select: { amount: true, type: true } },
        rations: { select: { totalCost: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const data: IPartner[] = rawPartners.map((p) => {
      let drawings = 0;
      let injections = 0;

      p.transactions.forEach((t) => {
        const amt = Number(t.amount);
        if (t.type === "CAPITAL_INJECTION") injections += amt;
        else drawings += amt;
      });

      const rations = p.rations.reduce((sum, r) => sum + Number(r.totalCost), 0);
      const opening = Number(p.openingCapital);
      const currentBalance = opening + injections - drawings - rations;

      return {
        id: p.id,
        name: p.name,
        relationship: p.relationship as any,
        phone: p.phone,
        nidNumber: p.nidNumber,
        equityPercent: Number(p.equityPercent),
        openingCapital: opening,
        currentBalance,
        monthlyAllowance: Number(p.monthlyAllowance),
        status: p.status,
        notes: p.notes,
        totalDrawings: drawings,
        totalRations: rations,
        createdAt: p.createdAt,
      };
    });

    return { success: true, data };
  } catch (error: any) {
    console.error("getPartners error:", error);
    return { success: false, error: error.message || "Failed to load partners." };
  }
}

// ==========================================
// 2. GET RECENT PARTNER TRANSACTIONS
// ==========================================
export async function getPartnerTransactions(limit = 50): Promise<{ success: boolean; data?: IPartnerTransaction[]; error?: string }> {
  try {
    const user = await requireAuth();
    if (user.role !== "OWNER") return { success: false, error: "Unauthorized" };

    const raw = await prisma.partnerTransaction.findMany({
      where: { shopId: user.shopId },
      take: limit,
      orderBy: { transactionDate: "desc" },
      include: {
        partner: { select: { name: true } },
        account: { select: { name: true } },
      },
    });

    const data: IPartnerTransaction[] = raw.map((t) => ({
      id: t.id,
      voucherNo: t.voucherNo,
      type: t.type as any,
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

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch transactions." };
  }
}

// ==========================================
// 3. GET HOME GROCERY RATIONS
// ==========================================
export async function getPartnerRations(limit = 50): Promise<{ success: boolean; data?: IPartnerRation[]; error?: string }> {
  try {
    const user = await requireAuth();
    if (user.role !== "OWNER") return { success: false, error: "Unauthorized" };

    const raw = await prisma.partnerRation.findMany({
      where: { shopId: user.shopId },
      take: limit,
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

    const data: IPartnerRation[] = raw.map((r) => ({
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

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch grocery rations." };
  }
}