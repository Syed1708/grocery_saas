import { prisma } from "@/lib/prisma";
import { ISupplier } from "@/types";

export async function getSuppliers(
  shopId: string,
  branchId?: string | null
): Promise<ISupplier[]> {
  const suppliers = await prisma.supplier.findMany({
    where: {
      shopId,
      status: "active",
      // 👈 Shows active branch suppliers + Global suppliers (branchId: null)
      ...(branchId
        ? {
            OR: [{ branchId }, { branchId: null }],
          }
        : {}),
    },
    // Project only the columns the table needs (faster payloads)
    select: {
      id: true,
      name: true,
      companyName: true,
      phone: true,
      email: true,
      village: true,
      district: true,
      address: true,
      contactPerson: true,
      openingDue: true,
      currentDue: true,
      status: true,
      shopId: true,
      branchId: true,
      createdAt: true,
      branch: { select: { id: true, name: true, code: true } },
    },
    orderBy: { name: "asc" },
  });

  return suppliers.map((s) => ({
    id: s.id,
    name: s.name,
    companyName: s.companyName,
    phone: s.phone,
    email: s.email,
    village: s.village,
    district: s.district,
    address: s.address,
    contactPerson: s.contactPerson || s.name,
    openingDue: Number(s.openingDue || 0),
    currentDue: Number(s.currentDue || 0),
    status: s.status,
    shopId: s.shopId,
    branchId: s.branchId,
    branch: s.branch,
    branchName: s.branch?.name || "Global (সকল শাখা)",
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
