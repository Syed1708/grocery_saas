import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import { getPosCatalog } from "@/queries/sale-queries";
import { getCustomers } from "@/queries/customer-queries";
import { getCategoriesForSelect } from "@/queries/product-queries";
import { prisma } from "@/lib/prisma";
import PosTerminalView from "./_components/PosTerminalView";
import { IPosProduct, IPosCustomer, IPosShopConfig } from "@/types/sale";

export default async function PosPage() {
  const user = await requireAuth({
    requiredPermission: PERMISSIONS.POS_ACCESS,
    requireActiveStatus: true,
  });

  const { shopId, activeBranchId } = user;

  // Parallel database queries
  const [rawCatalog, rawCustomers, categories, rawShop, activeBranch, cashierUser] = await Promise.all([
    getPosCatalog(shopId, activeBranchId),
    getCustomers(shopId, activeBranchId),
    getCategoriesForSelect(shopId),
    prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        name: true,
        phone: true,
        address: true,
        currencySymbol: true,
        enableVat: true,
        vatPercent: true,
        thermalWidth: true,
        invoiceHeader: true,
        invoiceFooter: true,
      },
    }),
    // 👈 FIX: Fetch the actual ACTIVE branch name (e.g. Mirpur Branch)!
    prisma.branch.findUnique({
      where: { id: activeBranchId },
      select: { name: true },
    }),
    prisma.user.findUnique({
      where: { id: user.userId },
      select: { name: true },
    }),
  ]);

  if (!rawShop) redirect("/dashboard");

  const catalog: IPosProduct[] = rawCatalog.map((p: any) => ({
    id: p.id,
    name: p.name,
    nameEn: p.nameEn ?? null,
    barcode: p.barcode,
    sku: p.sku,
    unitPrice: Number(p.sellingPrice ?? p.unitPrice),
    unitId: p.unitId,
    unitCode: p.unit?.shortCode || p.unitCode || "pcs",
    categoryId: p.categoryId,
    categoryName: p.category?.name || p.categoryName || "সাধারণ",
    stockAvailable: Number(p.stocks?.[0]?.quantity ?? p.stockAvailable ?? 0),
    alertQuantity: Number(p.alertQuantity || 5),
    vatPercent: Number(p.vatPercent || 0),
  }));

  const customers: IPosCustomer[] = rawCustomers.map((c: any) => ({
    id: c.id,
    name: c.name,
    phone: c.phone ?? null,
    currentDue: Number(c.currentDue || 0),
    creditLimit: Number(c.creditLimit || 0),
    type: c.type,
  }));

  const shop: IPosShopConfig = {
    name: rawShop.name,
    phone: rawShop.phone,
    address: rawShop.address,
    currencySymbol: rawShop.currencySymbol || "৳",
    enableVat: Boolean(rawShop.enableVat),
    vatPercent: Number(rawShop.vatPercent || 0),
    thermalWidth: rawShop.thermalWidth || "80mm",
    invoiceHeader: rawShop.invoiceHeader,
    invoiceFooter: rawShop.invoiceFooter,
  };

  return (
    <PosTerminalView
      catalog={catalog}
      customers={customers}
      categories={categories}
      shop={shop}
      cashierName={cashierUser?.name || "Cashier"}
      // 👈 Resolves "Mirpur Branch" when switched to Mirpur!
      branchName={activeBranch?.name || "Main Branch"}
    />
  );
}