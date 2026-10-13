import { prisma } from "@/lib/prisma";
import { ISupplier } from "@/types";

export async function getSuppliers(shopId: string): Promise<ISupplier[]> {
  const suppliers = await prisma.supplier.findMany({
    where: { shopId },
    orderBy: { createdAt: "desc" },
  });

  return suppliers.map((s) => ({
    id: s.id,
    name: s.name,
    companyName: s.companyName || "",
    phone: s.phone,
    email: s.email,
    village: s.village,
    district: s.district,
    address: s.address,
    payableBalance: Number(s.currentDue), // 👈 Maps currentDue to payableBalance for UI
    shopId: s.shopId,
    createdAt: s.createdAt,
  }));
}

export async function getSuppliersForSelect(shopId: string) {
  return await prisma.supplier.findMany({
    where: { shopId, status: "active" },
    select: { id: true, name: true, companyName: true },
    orderBy: { name: "asc" },
  });
}