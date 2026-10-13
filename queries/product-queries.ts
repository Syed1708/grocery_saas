import { prisma } from "@/lib/prisma";
import { IProduct, ICategoryOption, IUnitOption } from "@/types";

export async function getProducts(shopId: string): Promise<IProduct[]> {
  const products = await prisma.product.findMany({
    where: { shopId },
    include: {
      category: { select: { id: true, name: true } },
      unit: { select: { id: true, name: true, code: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    barcode: p.barcode,
    description: p.description,
    costPrice: Number(p.costPrice),
    sellingPrice: Number(p.sellingPrice),
    stockQuantity: Number(p.stockQuantity),
    minStockAlert: Number(p.minStockAlert),
    unitId: p.unitId,
    unitName: p.unit.name,
    unitCode: p.unit.code,
    bulkUnitName: p.bulkUnitName,
    conversionFactor: Number(p.conversionFactor || 1),
    image: p.image,
    categoryId: p.categoryId,
    categoryName: p.category.name,
    createdAt: p.createdAt,
  }));
}

export async function getCategoriesForSelect(shopId: string): Promise<ICategoryOption[]> {
  return await prisma.category.findMany({
    where: { shopId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function getUnitsForSelect(shopId: string): Promise<IUnitOption[]> {
  return await prisma.unit.findMany({
    where: { shopId },
    select: {
      id: true,
      name: true,
      code: true,
      _count: { select: { products: true } },
    },
    orderBy: { name: "asc" },
  });
}