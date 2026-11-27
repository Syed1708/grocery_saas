import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import { prisma } from "@/lib/prisma";
import { getExpenseReportData } from "@/queries/expense-report-queries";
import ExpenseReportClient from "./_components/ExpenseReportClient";
import { IExpenseFilterParams } from "@/types/expenses";

interface PageProps {
  searchParams: Promise<IExpenseFilterParams & { page?: string; pageSize?: string }>;
}

const PAGE_SIZES = [10, 20, 50, 100];

function parsePage(value: string | undefined): number {
  const page = Number(value);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

export default async function ExpenseReportPage({ searchParams }: PageProps) {
  const { shopId, activeBranchId: branchId } = await requireAuth({
    requiredPermission: PERMISSIONS.REPORTS_EXPENSES,
    requireActiveStatus: true,
  });
  const rawFilters = await searchParams;
  const parsedPageSize = Number(rawFilters.pageSize);
  const pageSize = PAGE_SIZES.includes(parsedPageSize) ? parsedPageSize : 10;
  const page = parsePage(rawFilters.page);

  const [expenseData, categories, shop, branch] = await Promise.all([
    getExpenseReportData(shopId, branchId, rawFilters, page, pageSize),
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
        rowsTotal={expenseData.rowsTotal}
        page={expenseData.rowsPage}
        pageSize={expenseData.rowsPageSize}
        filters={rawFilters}
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