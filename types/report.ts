export interface ISalesReportKPIs {
  totalGrossSales: number;
  totalNetSales: number;
  totalCashCollected: number;
  totalDueOutstanding: number;
  totalDiscount: number;
  totalInvoices: number;
}

export interface ISaleReportRow {
  id: string;
  invoiceNo: string;
  saleDate: string | Date;
  customerName: string;
  customerPhone?: string | null;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  cashierName: string;
}

export interface IItemVelocityRow {
  productId: string;
  productName: string;
  barcode: string;
  totalQuantity: number;
  totalRevenue: number;
  totalProfit: number;
  marginPercent: number;
}

export interface ISalesFilterParams {
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  search?: string;
}



export interface IStockReportItem {
  id: string;
  name: string;
  barcode: string;
  categoryName: string;
  unitCode: string;
  currentStock: number;
  costPrice: number;
  sellingPrice: number;
  totalCostValue: number;
  totalRetailValue: number;
  isLowStock: boolean;
}