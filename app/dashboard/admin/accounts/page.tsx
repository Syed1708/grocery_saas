import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { redirect } from "next/navigation";
import { getAccounts, getBankCheques, getLoans } from "@/queries/account-queries";
import AccountsClient from "./_components/AccountsClient";
import { prisma } from "@/lib/prisma";

export default async function AccountsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.shopId) {
    redirect("/login");
  }

  const { shopId } = session.user;

  const [accounts, cheques, loans, shop] = await Promise.all([
    getAccounts(shopId),
    getBankCheques(shopId),
    getLoans(shopId),
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
        loans={loans} // 👈 Pass loans
        currencySymbol={shop?.currencySymbol || "৳"}
      />
    </div>
  );
}