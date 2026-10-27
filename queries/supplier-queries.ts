import { prisma } from "@/lib/prisma";
import { ISupplier } from "@/types";

export async function getSuppliers(
  shopId: string,
  branchId?: string | null
): Promise<ISupplier[]> {
  const rawSuppliers = await prisma.supplier.findMany({
    where: {
      shopId,
      status: "active",
      ...(branchId
        ? {
            OR: [
              { branchId: branchId },
              { branchId: null }, // Corporate vendors visible everywhere
            ],
          }
        : {}),
    },
    include: {
      branch: {
        select: { id: true, name: true, code: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return rawSuppliers.map((s) => ({
    id: s.id,
    name: s.name,
    companyName: s.companyName,
    phone: s.phone,
    email: s.email,
    village: s.village,
    district: s.district,
    address: s.address,
    contactPerson: s.contactPerson,
    openingDue: Number(s.openingDue),
    currentDue: Number(s.currentDue),
    status: s.status,
    shopId: s.shopId,
    branchId: s.branchId,
    branch: s.branch,
    branchName: s.branch?.name || "Global Distributor",
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