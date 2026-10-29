export interface IDashboardKpi {
  todaySales: number;
  todaySalesDelta: number; // % change vs yesterday
  todayOrdersCount: number;
  monthSales: number;
  customerDuesTotal: number;
  supplierPayablesTotal: number;
  activeCashAndBank: number;
  lowStockCount: number;
  expiringSoonCount: number;
}

export interface ISalesTrendPoint {
  date: string; // e.g. "Oct 12"
  sales: number;
  cost: number;
  expense: number;
  netProfit: number;
}

export interface ICategorySalesShare {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export interface IHourlyRushPoint {
  hour: string; // e.g. "10 AM", "6 PM"
  orders: number;
  sales: number;
}

export interface IRecentSaleInvoice {
  id: string;
  invoiceNo: string;
  customerName: string;
  grandTotal: number;
  paidAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: Date;
}

export interface IStockAlertItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  alertQuantity: number;
  type: "LOW_STOCK" | "EXPIRED" | "EXPIRING_SOON";
  expiryDate?: Date | null;
}

export interface IDashboardData {
  kpis: IDashboardKpi;
  salesTrends: ISalesTrendPoint[];
  categoryShares: ICategorySalesShare[];
  hourlyRush: IHourlyRushPoint[];
  recentSales: IRecentSaleInvoice[];
  stockAlerts: IStockAlertItem[];
}