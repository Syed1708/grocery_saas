import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getDefaultProfitLossRange } from "@/lib/profit-loss-range";
import { IProfitLossData, IProfitLossFilterParams } from "@/types/profit-loss";

export async function getProfitLossData(
  shopId: string,
  branchId: string,
  filters: IProfitLossFilterParams
): Promise<IProfitLossData> {
  const defaultRange = getDefaultProfitLossRange();
  const startDate = filters.startDate || defaultRange.startDate;
  const endDate = filters.endDate || defaultRange.endDate;

  const dateFilter: Prisma.DateTimeFilter = {};
  const start = new Date(`${startDate}T00:00:00`);
  if (!Number.isNaN(start.getTime())) dateFilter.gte = start;
  const end = new Date(`${endDate}T00:00:00`);
  if (!Number.isNaN(end.getTime())) {
    // Exclusive next-day boundary includes the whole end date.
    end.setDate(end.getDate() + 1);
    dateFilter.lt = end;
  }

  // 1. Sales & Gross Revenue
  const salesAgg = await prisma.sale.aggregate({
    where: {
      shopId,
      branchId,
      saleDate: dateFilter,
    },
    _sum: {
      subtotal: true,
      discount: true,
      grandTotal: true,
    },
  });

  // 2. Cost of Goods Sold (COGS) from SaleItems
  const saleItems = await prisma.saleItem.findMany({
    where: {
      sale: {
        shopId,
        branchId,
        saleDate: dateFilter,
      },
    },
    select: {
      quantity: true,
      purchaseCost: true,
    },
  });

  let cogsAmount = 0;
  for (const item of saleItems) {
    cogsAmount += Number(item.quantity) * Number(item.purchaseCost);
  }

  // 3. Sale Returns & Damaged Write-offs
  const saleReturns = await prisma.saleReturn.findMany({
    where: {
      shopId,
      branchId,
      returnDate: dateFilter,
    },
    include: {
      sale: {
        select: {
          items: { select: { productId: true, purchaseCost: true } },
        },
      },
      items: {
        select: {
          productId: true,
          quantity: true,
          itemCondition: true,
          product: { select: { purchasePrice: true } },
        },
      },
    },
  });

  let totalReturnsAmount = 0;
  let damagedGoodsLoss = 0;
  let cogsRestockAdjustment = 0;

  for (const ret of saleReturns) {
    totalReturnsAmount += Number(ret.totalRefund);

    // Use the original sale line cost so historical cost is preserved even if
    // the product purchase price changed later.
    const costByProduct = new Map<string, number>();
    for (const saleItem of ret.sale.items) {
      if (!costByProduct.has(saleItem.productId)) {
        costByProduct.set(saleItem.productId, Number(saleItem.purchaseCost));
      }
    }

    for (const rItem of ret.items) {
      const saleCost = costByProduct.get(rItem.productId);
      const unitCost = saleCost && saleCost > 0 ? saleCost : Number(rItem.product.purchasePrice);
      const lineCost = Number(rItem.quantity) * unitCost;
      if (rItem.itemCondition === "DAMAGED") {
        damagedGoodsLoss += lineCost;
      } else {
        cogsRestockAdjustment += lineCost;
      }
    }
  }

  // Stock wastage is written off directly from inventory (no expense row).
  const wastageAgg = await prisma.stockWastage.aggregate({
    where: {
      shopId,
      branchId,
      date: dateFilter,
    },
    _sum: { totalCost: true },
  });
  damagedGoodsLoss += Number(wastageAgg._sum.totalCost || 0);

  // 4. Operating Expenses by Category
  const rawExpenses = await prisma.expense.findMany({
    where: {
      shopId,
      branchId,
      expenseDate: dateFilter,
    },
    include: {
      category: { select: { id: true, name: true, code: true } },
    },
  });

  let operatingExpenses = 0;
  const categoryMap = new Map<string, { name: string; amount: number }>();

  for (const exp of rawExpenses) {
    const amt = Number(exp.amount);

    // Sale-return damage is already counted from the return lines below; the
    // return action also posts an EXP-DAMAGE expense for the same loss.
    const isAutoReturnDamage =
      exp.category.code === "EXP-DAMAGE" && exp.reference?.startsWith("Return #") === true;
    if (isAutoReturnDamage) continue;

    operatingExpenses += amt;

    const catId = exp.categoryId;
    const catName = exp.category.name;
    const cur = categoryMap.get(catId) || { name: catName, amount: 0 };
    categoryMap.set(catId, { name: catName, amount: cur.amount + amt });
  }

  const expenseCategories = Array.from(categoryMap.entries()).map(([id, val]) => ({
    categoryId: id,
    categoryName: val.name,
    totalAmount: val.amount,
  }));

  // 5. Staff Payroll
  const payrollAgg = await prisma.payroll.aggregate({
    where: {
      shopId,
      branchId,
      salaryDate: dateFilter,
    },
    _sum: { netSalary: true },
  });

  const payrollExpenses = Number(payrollAgg._sum.netSalary || 0);

  // 6. Other Incomes
  const incomeAgg = await prisma.otherIncome.aggregate({
    where: {
      shopId,
      branchId,
      incomeDate: dateFilter,
    },
    _sum: { amount: true },
  });

  const otherIncome = Number(incomeAgg._sum.amount || 0);

  // ==========================================
  // FINAL P&L CALCULATIONS
  // ==========================================
  const grossSales = Number(salesAgg._sum.subtotal || 0);
  const salesDiscount = Number(salesAgg._sum.discount || 0);
  const netSalesRevenue = Math.max(0, grossSales - salesDiscount - totalReturnsAmount);

  const netCogs = Math.max(0, cogsAmount - cogsRestockAdjustment);
  const grossProfit = netSalesRevenue - netCogs;
  const grossMarginPercent = netSalesRevenue > 0 ? (grossProfit / netSalesRevenue) * 100 : 0;

  const totalOpex = operatingExpenses + payrollExpenses + damagedGoodsLoss;
  const netProfit = grossProfit - totalOpex + otherIncome;
  const netMarginPercent = netSalesRevenue > 0 ? (netProfit / netSalesRevenue) * 100 : 0;

  return {
    grossSales,
    salesDiscount,
    salesReturns: totalReturnsAmount,
    netSalesRevenue,
    cogsAmount,
    cogsRestockAdjustment,
    netCogs,
    grossProfit,
    grossMarginPercent: Number(grossMarginPercent.toFixed(1)),
    operatingExpenses,
    payrollExpenses,
    damagedGoodsLoss,
    totalOpex,
    expenseCategories,
    otherIncome,
    netProfit,
    netMarginPercent: Number(netMarginPercent.toFixed(1)),
  };
}