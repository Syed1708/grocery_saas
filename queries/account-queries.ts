import { prisma } from "@/lib/prisma";
import { IAccount, IBankCheque, ILoan } from "@/types";

// 1. ACCOUNTS & WALLETS
export async function getAccounts(
  shopId: string,
  branchId?: string | null
): Promise<IAccount[]> {
  const accounts = await prisma.account.findMany({
    where: {
      shopId,
      status: "active",
        // 👈 STRICT: Only show accounts belonging directly to this branch
      ...(branchId ? { branchId } : {}),
    },
    include: {
      branch: { select: { name: true, code: true } },
    },
    orderBy: { name: "asc" },
  });

  return accounts.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    accountNumber: a.accountNumber,
    bankName: a.bankName,
    branchName: a.branchName, // Bank branch
    openingBalance: Number(a.openingBalance),
    currentBalance: Number(a.currentBalance),
    status: a.status,
    notes: a.notes,
    shopId: a.shopId,
    branchId: a.branchId,
    storeBranchName: a.branch?.name || null, // ERP Store Branch
    createdAt: a.createdAt,
  }));
}

// 2. BANK CHEQUES (Branch-isolated)
export async function getBankCheques(
  shopId: string,
  branchId?: string | null
): Promise<IBankCheque[]> {
  const cheques = await prisma.bankCheque.findMany({
    where: {
      shopId,
      ...(branchId ? { branchId } : {}), // 👈 Filter cheques accepted/issued at this branch
    },
    include: {
      account: { select: { name: true } },
      branch: { select: { name: true } },
    },
    orderBy: { chequeDate: "desc" },
  });

  return cheques.map((c) => ({
    id: c.id,
    type: c.type,
    partyType: c.partyType,
    partyName: c.partyName,
    bankName: c.bankName,
    chequeNumber: c.chequeNumber,
    chequeDate: c.chequeDate,
    clearingDate: c.clearingDate,
    amount: Number(c.amount),
    status: c.status,
    accountId: c.accountId,
    accountName: c.account?.name || null,
    note: c.note,
    branchId: c.branchId,
    storeBranchName: c.branch?.name || null,
    createdAt: c.createdAt,
  }));
}

// 3. LOANS & HAWLAT (Branch-isolated)
export async function getLoans(
  shopId: string,
  branchId?: string | null
): Promise<ILoan[]> {
  const loans = await prisma.loan.findMany({
    where: {
      shopId,
      ...(branchId ? { branchId } : {}), // 👈 Filter loans handled by this branch
    },
    include: {
      account: { select: { name: true } },
      branch: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return loans.map((l) => ({
    id: l.id,
    type: l.type,
    personName: l.personName,
    phone: l.phone,
    amount: Number(l.amount),
    totalPaid: Number(l.totalPaid),
    remainingAmount: Number(l.remainingAmount),
    loanDate: l.loanDate,
    dueDate: l.dueDate,
    status: l.status,
    accountName: l.account?.name || null,
    notes: l.notes,
    branchId: l.branchId,
    storeBranchName: l.branch?.name || null,
    createdAt: l.createdAt,
  }));
}