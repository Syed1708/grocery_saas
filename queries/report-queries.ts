import { prisma } from "@/lib/prisma";
import { ICashRegisterClosing, IStockReportItem } from "@/types";

export async function getPastClosings(shopId: string, branchId?: string | null): Promise<ICashRegisterClosing[]> {
  const closings = await prisma.cashRegister.findMany({
    where: { shopId, ...(branchId ? { branchId } : {}) },
    include: { user: { select: { name: true } } },
    orderBy: { closingDate: "desc" },
  });

  return closings.map((c) => ({
    id: c.id,
    closingDate: c.closingDate,
    openingCash: Number(c.openingCash),
    cashSales: Number(c.cashSales),
    cashDueCollected: Number(c.cashDueCollected),
    cashOtherIncome: Number(c.cashOtherIncome),
    cashExpenses: Number(c.cashExpenses),
    cashSupplierPaid: Number(c.cashSupplierPaid),
    cashRefunds: Number(c.cashRefunds),
    expectedCash: Number(c.expectedCash),
    countedCash: Number(c.countedCash),
    difference: Number(c.difference),
    totalInvoices: c.totalInvoices,
    notes: c.notes,
    status: c.status,
    cashierName: c.user?.name || "Cashier",
    createdAt: c.createdAt,
  }));
}

export async function getStockValuationReport(shopId: string, branchId?: string | null): Promise<IStockReportItem[]> {
  const products = await prisma.product.findMany({
    where: { shopId, status: "active" },
    include: {
      category: { select: { name: true } },
      unit: { select: { shortCode: true } },
      stocks: branchId ? { where: { branchId } } : true,
    },
    orderBy: { name: "asc" },
  });

  return products.map((p) => {
    const stock = p.stocks.reduce((sum, s) => sum + Number(s.quantity || 0), 0);
    const cost = Number(p.purchasePrice);
    const retail = Number(p.sellingPrice);
    return {
      id: p.id,
      name: p.name,
      barcode: p.barcode,
      categoryName: p.category.name,
      unitCode: p.unit.shortCode,
      currentStock: stock,
      costPrice: cost,
      sellingPrice: retail,
      totalCostValue: stock * cost,
      totalRetailValue: stock * retail,
      isLowStock: stock <= Number(p.alertQuantity),
    };
  });
}