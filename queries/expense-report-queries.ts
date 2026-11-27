import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import {
  IExpenseReportKPIs,
  IExpenseCategoryStat,
  IExpenseReportRow,
  IExpenseFilterParams,
} from "@/types/expenses";

const expenseReportInclude = {
  category: { select: { id: true, name: true, code: true } },
  user: { select: { name: true } },
} satisfies Prisma.ExpenseInclude;

type ExpenseReportExpense = Prisma.ExpenseGetPayload<{
  include: typeof expenseReportInclude;
}>;

function buildExpenseReportWhere(
  shopId: string,
  branchId: string,
  filters: IExpenseFilterParams
): Prisma.ExpenseWhereInput {
  const where: Prisma.ExpenseWhereInput = {
    shopId,
    branchId,
  };

  if (filters.startDate || filters.endDate) {
    const expenseDate: Prisma.DateTimeFilter = {};
    if (filters.startDate) expenseDate.gte = new Date(`${filters.startDate}T00:00:00`);
    if (filters.endDate) expenseDate.lte = new Date(`${filters.endDate}T23:59:59.999`);
    where.expenseDate = expenseDate;
  }

  if (filters.categoryId && filters.categoryId !== "all") {
    where.categoryId = filters.categoryId;
  }

  if (filters.paymentMethod && filters.paymentMethod !== "all") {
    where.paymentMethod = filters.paymentMethod;
  }

  if (filters.search) {
    where.OR = [
      { voucherNo: { contains: filters.search } },
      { reference: { contains: filters.search } },
      { note: { contains: filters.search } },
    ];
  }

  return where;
}

function mapExpenseReportRow(e: ExpenseReportExpense): IExpenseReportRow {
  return {
    id: e.id,
    voucherNo: e.voucherNo,
    expenseDate: e.expenseDate,
    amount: Number(e.amount),
    paymentMethod: e.paymentMethod,
    reference: e.reference,
    note: e.note,
    receiptImage: e.receiptImage,
    categoryId: e.categoryId,
    categoryName: e.category.name,
    categoryCode: e.category.code,
    spentBy: e.user?.name || "Authorized Staff",
  };
}

/** All filtered rows for CSV/PDF exports (never paginated). */
export async function getAllExpenseReportRows(
  shopId: string,
  branchId: string,
  filters: IExpenseFilterParams
): Promise<IExpenseReportRow[]> {
  const where = buildExpenseReportWhere(shopId, branchId, filters);
  const rows = await prisma.expense.findMany({
    where,
    include: expenseReportInclude,
    orderBy: { expenseDate: "desc" },
  });
  return rows.map(mapExpenseReportRow);
}

export async function getExpenseReportData(
  shopId: string,
  branchId: string,
  filters: IExpenseFilterParams,
  page = 1,
  pageSize = 10
): Promise<{
  kpis: IExpenseReportKPIs;
  rows: IExpenseReportRow[];
  rowsTotal: number;
  rowsPage: number;
  rowsPageSize: number;
  categoryStats: IExpenseCategoryStat[];
}> {
  const where = buildExpenseReportWhere(shopId, branchId, filters);
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);

  const [agg, methodGroups, categoryGroups, rowsTotal, rawExpenses] = await Promise.all([
    prisma.expense.aggregate({
      where,
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.expense.groupBy({
      by: ["paymentMethod"],
      where,
      _sum: { amount: true },
    }),
    prisma.expense.groupBy({
      by: ["categoryId"],
      where,
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.expense.count({ where }),
    prisma.expense.findMany({
      where,
      include: expenseReportInclude,
      orderBy: { expenseDate: "desc" },
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
    }),
  ]);

  const totalExpenseAmount = Number(agg._sum.amount || 0);
  let cashExpenseAmount = 0;
  let bankExpenseAmount = 0;
  let otherMethodExpenseAmount = 0;

  for (const group of methodGroups) {
    const amount = Number(group._sum.amount || 0);
    const method = group.paymentMethod?.toLowerCase() || "cash";
    if (method === "cash") cashExpenseAmount += amount;
    else if (method === "bank") bankExpenseAmount += amount;
    else otherMethodExpenseAmount += amount;
  }

  const categoryIds = categoryGroups.map((group) => group.categoryId);
  const categories = await prisma.expenseCategory.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true, code: true },
  });
  const categoryMap = new Map(categories.map((category) => [category.id, category]));

  const categoryStats: IExpenseCategoryStat[] = categoryGroups
    .map((group) => {
      const category = categoryMap.get(group.categoryId);
      const amount = Number(group._sum.amount || 0);
      return {
        categoryId: group.categoryId,
        categoryName: category?.name || "Unknown Category",
        categoryCode: category?.code || "N/A",
        totalAmount: amount,
        percentage:
          totalExpenseAmount > 0
            ? Number(((amount / totalExpenseAmount) * 100).toFixed(1))
            : 0,
        vouchersCount: group._count.id,
      };
    })
    .sort((a, b) => b.totalAmount - a.totalAmount);

  const kpis: IExpenseReportKPIs = {
    totalExpenseAmount,
    cashExpenseAmount,
    bankExpenseAmount,
    otherMethodExpenseAmount,
    totalVouchersCount: agg._count.id || 0,
  };

  return {
    kpis,
    rows: rawExpenses.map(mapExpenseReportRow),
    rowsTotal,
    rowsPage: safePage,
    rowsPageSize: safePageSize,
    categoryStats,
  };
}
