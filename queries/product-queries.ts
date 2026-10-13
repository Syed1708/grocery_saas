import { prisma } from "@/lib/prisma";
import { IProduct, ICategoryOption, IUnitOption } from "@/types";

interface ExtraOption {
  id: string;
  name: string;
}

/**
 * GET PRODUCTS QUERY (Server Component)
 * - Reads all products belonging to the store
 * - Joins Category, Unit, Brand, and Section
 * - Calculates accurate stock for the active branch (or sums all branches)
 * - Serializes Prisma Decimal objects to plain JavaScript numbers
 */
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
      stocks: branchId
        ? { where: { branchId } }
        : true, // If branchId provided, filters to branch; otherwise loads all
    },
    orderBy: { createdAt: "desc" },
  });

  return products.map((p) => {
    // Calculate stock quantity: branch-specific if branchId provided, or total across all branches
    const currentStock = p.stocks.reduce(
      (sum, s) => sum + Number(s.quantity || 0),
      0
    );

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
      stockQuantity: currentStock, // 👈 Real branch stock from ProductStock!
      minStockAlert: Number(p.alertQuantity),
      unitId: p.unitId,
      unitName: p.unit.name,
      unitCode: p.unit.shortCode,
      bulkUnitName: null,
      conversionFactor: 1,
      image: p.image,
      categoryId: p.categoryId,
      categoryName: p.category.name,
      brandId: p.brandId || null,
      brandName: p.brand?.name || null,
      sectionId: p.sectionId || null,
      sectionName: p.section?.name || null,
      status: p.status,
      createdAt: p.createdAt,
    };
  });
}

/**
 * GET SINGLE PRODUCT BY ID
 */
export async function getProductById(
  id: string,
  shopId: string,
  branchId?: string | null
): Promise<IProduct | null> {
  const p = await prisma.product.findFirst({
    where: { id, shopId },
    include: {
      category: { select: { id: true, name: true } },
      unit: { select: { id: true, name: true, shortCode: true } },
      brand: { select: { id: true, name: true } },
      section: { select: { id: true, name: true } },
      stocks: branchId ? { where: { branchId } } : true,
    },
  });

  if (!p) return null;

  const currentStock = p.stocks.reduce(
    (sum, s) => sum + Number(s.quantity || 0),
    0
  );

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
    stockQuantity: currentStock,
    minStockAlert: Number(p.alertQuantity),
    unitId: p.unitId,
    unitName: p.unit.name,
    unitCode: p.unit.shortCode,
    bulkUnitName: null,
    conversionFactor: 1,
    image: p.image,
    categoryId: p.categoryId,
    categoryName: p.category.name,
    brandId: p.brandId || null,
    brandName: p.brand?.name || null,
    sectionId: p.sectionId || null,
    sectionName: p.section?.name || null,
    status: p.status,
    createdAt: p.createdAt,
  };
}

/**
 * DROPDOWN HELPER: CATEGORIES
 */
export async function getCategoriesForSelect(
  shopId: string
): Promise<ICategoryOption[]> {
  return await prisma.category.findMany({
    where: { shopId, status: "active" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

/**
 * DROPDOWN HELPER: UNITS (UOM)
 */
export async function getUnitsForSelect(
  shopId: string
): Promise<IUnitOption[]> {
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

/**
 * DROPDOWN HELPER: BRANDS / COMPANIES
 */
export async function getBrandsForSelect(
  shopId: string
): Promise<ExtraOption[]> {
  return await prisma.brand.findMany({
    where: { shopId, status: "active" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

/**
 * DROPDOWN HELPER: PRODUCT SECTIONS (তাক ও র্যাক)
 */
export async function getSectionsForSelect(
  shopId: string
): Promise<ExtraOption[]> {
  return await prisma.productSection.findMany({
    where: { shopId, status: "active" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}