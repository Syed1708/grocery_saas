import { prisma } from "@/lib/prisma";

export async function getUnits(shopId: string) {
  const units = await prisma.unit.findMany({
    where: { shopId },
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
