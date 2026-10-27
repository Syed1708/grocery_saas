import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import {
  getExpenseCategories,
  getExpenses,
  getOtherIncomes,
  getCompanyAssets,
  getOwnerTransactions,
} from "@/queries/finance-queries";
import ExpensesClient from "./_components/ExpensesClient";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function ExpensesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.shopId) {
    redirect("/login");
  } 

  // 👈 Explicit cast fixes the "Type 'string | undefined' is not assignable" error
  const shopId = session.user.shopId as string;
  const branchId = session.user.branchId || undefined;

  // 👈 Now pass branchId to ALL branch-scoped queries!
  const [categories, expenses, incomes, assets, equity, shop] = await Promise.all([
    getExpenseCategories(shopId),
    getExpenses(shopId, branchId),
    getOtherIncomes(shopId, branchId),    // ✅ Pass branchId
    getCompanyAssets(shopId, branchId),   // ✅ Pass branchId
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