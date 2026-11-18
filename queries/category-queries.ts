import { prisma } from "@/lib/prisma";
import { ICategory, ICategoryOption } from "@/types";

export interface CategoryWithCount extends ICategory {
  _count?: {
    products: number;
  };
}

/**
 * 1. GET CATEGORIES FOR DATA TABLE
 * - Scoped strictly to shopId
 * - Includes product count for each category
 */
export async function getCategories(shopId: string): Promise<CategoryWithCount[]> {
  const categories = await prisma.category.findMany({
    where: { shopId },
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description || null,
    image: c.image || null,
    status: c.status as ICategory["status"],
    shopId: c.shopId,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    _count: c._count,
  }));
}

/**
 * 2. GET ACTIVE CATEGORIES FOR DROPDOWNS (High-Speed Projection)
 * - Returns lean { id, name } payload for POS & Product Form dropdowns
 */
export async function getCategoriesForSelect(shopId: string): Promise<ICategoryOption[]> {
  return await prisma.category.findMany({
    where: { shopId, status: "active" },
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: "asc" },
  });
}