import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAccounts, getBankCheques, getLoans } from "@/queries/account-queries"; // adjust path
import AccountsClient from "./_components/AccountsClient";

export default async function AccountsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.shopId) {
    redirect("/login");
  }

  const shopId = session.user.shopId as string;
  const branchId = session.user.branchId || undefined;

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