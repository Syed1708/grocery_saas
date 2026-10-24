import { prisma } from "@/lib/prisma";

export async function getUnits(shopId: string) {
  const units = await prisma.unit.findMany({
    where: { shopId },
    include: {
      _count: { select: { products: true } },
    },
    orderBy: { name: "asc" },
  });

  return units.map((u) => ({
    id: u.id,
    name: u.name,
    code: u.shortCode, // 👈 Map shortCode to code
    _count: u._count,
  }));
}