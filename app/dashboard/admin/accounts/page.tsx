import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import { prisma } from "@/lib/prisma";
import { getAccounts, getBankCheques, getLoans } from "@/queries/account-queries"; // adjust path
import AccountsClient from "./_components/AccountsClient";

export default async function AccountsPage() {
  const { shopId, activeBranchId: branchId } = await requireAuth({
    requiredPermission: PERMISSIONS.FINANCE_BANKING,
    requireActiveStatus: true,
  });

  const [accounts, cheques, loans, shop] = await Promise.all([
    getAccounts(shopId, branchId),    // 👈 Pass branchId
    getBankCheques(shopId, branchId), // 👈 Pass branchId
    getLoans(shopId, branchId),       // 👈 Pass branchId
    prisma.shop.findUnique({
      where: { id: shopId },
      select: { currencySymbol: true },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <AccountsClient
        accounts={accounts}
        cheques={cheques}
        loans={loans}
        currencySymbol={shop?.currencySymbol || "৳"}
      />
    </div>
  );
}