import { prisma } from "@/lib/prisma";

export async function getCategories(shopId: string) {
  return await prisma.category.findMany({
    where: { shopId },
    orderBy: { createdAt: "desc" },
  });
}