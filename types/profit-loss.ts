export interface IExpenseCategoryBreakdown {
  categoryId: string;
  categoryName: string;
  totalAmount: number;
}

export interface IProfitLossData {
  // 1. Revenue
  grossSales: number;
  salesDiscount: number;
  salesReturns: number;
  netSalesRevenue: number;

  // 2. Cost of Goods Sold (COGS)
  cogsAmount: number;
  cogsRestockAdjustment: number; // Returns put back into stock
  netCogs: number;

  // 3. Gross Profit
  grossProfit: number;
  grossMarginPercent: number;

  // 4. Operating Expenses (OPEX)
  operatingExpenses: number;
  payrollExpenses: number;
  damagedGoodsLoss: number;
  totalOpex: number;
  expenseCategories: IExpenseCategoryBreakdown[];

  // 5. Other Income
  otherIncome: number;

  // 6. Net Profit
  netProfit: number;
  netMarginPercent: number;
}

export interface IProfitLossFilterParams {
  startDate?: string;
  endDate?: string;
}