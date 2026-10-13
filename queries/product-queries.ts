import { prisma } from "@/lib/prisma";
import { IProduct, ICategoryOption, IUnitOption } from "@/types";

export interface ItemWithCount {
  id: string;
  name: string;
  code?: string | null;
  companyName?: string | null;
  phone?: string | null;
  _count: { products: number };
}

export async function getProducts(
  shopId: string,
  branchId?: string | null
): Promise<IProduct[]> {
  const products = await prisma.product.findMany({
    where: { shopId },
    include: {
      category: { select: { id: true, name: true } },
      unit: { select: { id: true, name: true, shortCode: true } },
      brand: { select: { id: true, name: true } },
      section: { select: { id: true, name: true } },
      stocks: branchId ? { where: { branchId } } : true,
    },
    orderBy: { createdAt: "desc" },
  });

// Inside getProducts:
return products.map((p) => {
  const currentStock = p.stocks.reduce((sum, s) => sum + Number(s.quantity || 0), 0);

  return {
    id: p.id,
    name: p.name,
    nameEn: p.nameEn || null,
    barcode: p.barcode,
    sku: p.sku,
    description: p.description,
    costPrice: Number(p.purchasePrice),
    sellingPrice: Number(p.sellingPrice),
    wholesalePrice: p.wholesalePrice ? Number(p.wholesalePrice) : null,
    vatPercent: p.vatPercent ? Number(p.vatPercent) : 0, // 👈
    expiryDate: p.expiryDate ? p.expiryDate.toISOString().split("T")[0] : null, // 👈
    stockQuantity: currentStock,
    minStockAlert: Number(p.alertQuantity),
    unitId: p.unitId,
    unitName: p.unit.name,
    unitCode: p.unit.shortCode,
    bulkUnitName: p.bulkUnitName,
    conversionFactor: Number(p.conversionFactor || 1),
    image: p.image,
    categoryId: p.categoryId,
    categoryName: p.category.name,
    brandId: p.brandId || null,
    brandName: p.brand?.name || null,
    sectionId: p.sectionId || null,
    sectionName: p.section?.name || null,
    status: p.status as IProduct["status"], // 👈
    createdAt: p.createdAt,
  };
});
}

export async function getCategoriesForSelect(shopId: string): Promise<ICategoryOption[]> {
  return await prisma.category.findMany({
    where: { shopId, status: "active" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function getUnitsForSelect(shopId: string): Promise<IUnitOption[]> {
  const units = await prisma.unit.findMany({
    where: { shopId, status: "active" },
    select: {
      id: true,
      name: true,
      shortCode: true,
      _count: { select: { products: true } },
    },
    orderBy: { name: "asc" },
  });

  return units.map((u) => ({
    id: u.id,
    name: u.name,
    code: u.shortCode,
    _count: u._count,
  }));
}

export async function getBrandsForSelect(shopId: string): Promise<ItemWithCount[]> {
  return await prisma.brand.findMany({
    where: { shopId, status: "active" },
    select: {
      id: true,
      name: true,
      companyName: true,
      phone: true,
      _count: { select: { products: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getSectionsForSelect(shopId: string): Promise<ItemWithCount[]> {
  return await prisma.productSection.findMany({
    where: { shopId, status: "active" },
    select: {
      id: true,
      name: true,
      code: true,
      _count: { select: { products: true } },
    },
    orderBy: { name: "asc" },
  });
}