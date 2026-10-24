import { prisma } from "@/lib/prisma";
import { ICategory } from "@/types";

export async function getCategories(shopId: string): Promise<ICategory[]> {
  const categories = await prisma.category.findMany({
    where: { shopId },
    orderBy: { createdAt: "desc" },
  });

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    status: c.status,
    image: c.image,
    shopId: c.shopId,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));
}