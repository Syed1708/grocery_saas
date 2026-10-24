import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { redirect } from "next/navigation";
import {
  getExpenseCategories,
  getExpenses,
  getOtherIncomes,
  getCompanyAssets,
  getOwnerTransactions,
} from "@/queries/finance-queries";
import ExpensesClient from "./_components/ExpensesClient";
import { prisma } from "@/lib/prisma";

export default async function ExpensesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.shopId) {
    redirect("/login");
  }

  const { shopId, branchId } = session.user;

  const [categories, expenses, incomes, assets, equity, shop] = await Promise.all([
    getExpenseCategories(shopId),
    getExpenses(shopId, branchId),
    getOtherIncomes(shopId),
    getCompanyAssets(shopId),
    getOwnerTransactions(shopId),
    prisma.shop.findUnique({
      where: { id: shopId },
      select: { currencySymbol: true },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <ExpensesClient
        categories={categories}
        expenses={expenses}
        incomes={incomes}
        assets={assets}
        equity={equity}
        currencySymbol={shop?.currencySymbol || "৳"}
      />
    </div>
  );
}