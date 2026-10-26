import { prisma } from "@/lib/prisma";
import { 
  IExpenseReportKPIs, 
  IExpenseCategoryStat, 
  IExpenseReportRow, 
  IExpenseFilterParams 
} from "@/types/expenses";

export async function getExpenseReportData(
  shopId: string,
  branchId: string,
  filters: IExpenseFilterParams
) {
  const where: any = {
    shopId,
    branchId,
  };

  // Date Range Filter
  if (filters.startDate || filters.endDate) {
    where.expenseDate = {};
    if (filters.startDate) where.expenseDate.gte = new Date(`${filters.startDate}T00:00:00`);
    if (filters.endDate) where.expenseDate.lte = new Date(`${filters.endDate}T23:59:59`);
  }

  // Category Filter
  if (filters.categoryId && filters.categoryId !== "all") {
    where.categoryId = filters.categoryId;
  }

  // Payment Method Filter
  if (filters.paymentMethod && filters.paymentMethod !== "all") {
    where.paymentMethod = filters.paymentMethod;
  }

  // Search Filter
  if (filters.search) {
    where.OR = [
      { voucherNo: { contains: filters.search } },
      { reference: { contains: filters.search } },
      { note: { contains: filters.search } },
    ];
  }

  // 1. Fetch Expenses with category & user relations
  const rawExpenses = await prisma.expense.findMany({
    where,
    include: {
      category: { select: { id: true, name: true, code: true } },
      user: { select: { name: true } },
    },
    orderBy: { expenseDate: "desc" },
    take: 150,
  });

  let totalExpenseAmount = 0;
  let cashExpenseAmount = 0;
  let bankExpenseAmount = 0;
  let otherMethodExpenseAmount = 0;

  const categoryMap = new Map<string, { name: string; code: string; total: number; count: number }>();

  const rows: IExpenseReportRow[] = rawExpenses.map((e) => {
    const amt = Number(e.amount);
    totalExpenseAmount += amt;

    const method = e.paymentMethod?.toLowerCase() || "cash";
    if (method === "cash") cashExpenseAmount += amt;
    else if (method === "bank") bankExpenseAmount += amt;
    else otherMethodExpenseAmount += amt;

    // Category Aggregation
    const catId = e.categoryId;
    const catName = e.category.name;
    const catCode = e.category.code;
    const cur = categoryMap.get(catId) || { name: catName, code: catCode, total: 0, count: 0 };
    categoryMap.set(catId, { name: catName, code: catCode, total: cur.total + amt, count: cur.count + 1 });

    return {
      id: e.id,
      voucherNo: e.voucherNo,
      expenseDate: e.expenseDate,
      amount: amt,
      paymentMethod: e.paymentMethod,
      reference: e.reference,
      note: e.note,
      receiptImage: e.receiptImage,
      categoryId: e.categoryId,
      categoryName: e.category.name,
      categoryCode: e.category.code,
      spentBy: e.user?.name || "Authorized Staff",
    };
  });

  // Calculate percentage per category
  const categoryStats: IExpenseCategoryStat[] = Array.from(categoryMap.entries()).map(([id, val]) => ({
    categoryId: id,
    categoryName: val.name,
    categoryCode: val.code,
    totalAmount: val.total,
    percentage: totalExpenseAmount > 0 ? Number(((val.total / totalExpenseAmount) * 100).toFixed(1)) : 0,
    vouchersCount: val.count,
  })).sort((a, b) => b.totalAmount - a.totalAmount);

  const kpis: IExpenseReportKPIs = {
    totalExpenseAmount,
    cashExpenseAmount,
    bankExpenseAmount,
    otherMethodExpenseAmount,
    totalVouchersCount: rows.length,
  };

  return { kpis, rows, categoryStats };
}