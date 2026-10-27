import { prisma } from "@/lib/prisma";
import { ICustomer } from "@/types";

export async function getCustomers(
  shopId: string,
  branchId?: string | null
): Promise<ICustomer[]> {
  const rawCustomers = await prisma.customer.findMany({
    where: {
      shopId,
      status: "active",
       // 👈 STRICT: Only show customers registered at THIS branch!
      ...(branchId ? { branchId } : {}),
    },
    include: {
      branch: {
        select: { id: true, name: true, code: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return rawCustomers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    address: c.address,
    addressLine: c.address,
    type: c.type,
    village: c.village,
    district: c.district,
    creditLimit: Number(c.creditLimit),
    openingDue: Number(c.openingDue),
    currentDue: Number(c.currentDue),
    currentBalance: Number(c.currentDue),
    status: c.status,
    shopId: c.shopId,
    branchId: c.branchId,
    branch: c.branch,
    branchName: c.branch?.name || "Global (সকল শাখা)",
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));
}