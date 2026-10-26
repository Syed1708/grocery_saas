import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getExpenseReportData } from "@/queries/expense-report-queries";
import ExpenseReportClient from "./_components/ExpenseReportClient";
import { IExpenseFilterParams } from "@/types/expenses";

interface PageProps {
  searchParams: Promise<IExpenseFilterParams>;
}

export default async function ExpenseReportPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.shopId || !session?.user?.branchId) {
    redirect("/login");
  }

  const { shopId, branchId } = session.user;
  const filters = await searchParams;

  const [expenseData, categories, shop, branch] = await Promise.all([
    getExpenseReportData(shopId, branchId, filters),
    prisma.expenseCategory.findMany({
      where: { shopId, status: "active" },
      select: { id: true, name: true },
    }),
    prisma.shop.findUnique({
      where: { id: shopId },
      select: { name: true, phone: true, address: true, currencySymbol: true },
    }),
    prisma.branch.findUnique({
      where: { id: branchId },
      select: { name: true },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <ExpenseReportClient
        kpis={expenseData.kpis}
        rows={expenseData.rows}
        categoryStats={expenseData.categoryStats}
        currencySymbol={shop?.currencySymbol || "৳"}
        categories={categories}
        shop={{
          name: shop?.name || "Grocery ERP",
          phone: shop?.phone,
          address: shop?.address,
        }}
        branchName={branch?.name || "Main Branch"}
      />
    </div>
  );
}