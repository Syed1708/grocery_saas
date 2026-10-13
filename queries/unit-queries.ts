import { prisma } from "@/lib/prisma";

export async function getUnits(shopId: string) {
  return await prisma.unit.findMany({
    where: { shopId },
    include: {
      _count: { select: { products: true } },
    },
    orderBy: { name: "asc" },
  });
}