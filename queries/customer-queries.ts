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
    // Project only the columns the table needs (faster payloads)
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      address: true,
      type: true,
      village: true,
      district: true,
      creditLimit: true,
      openingDue: true,
      currentDue: true,
      status: true,
      shopId: true,
      branchId: true,
      createdAt: true,
      updatedAt: true,
      branch: { select: { id: true, name: true, code: true } },
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
    branchName: c.branch?.name || "N/A",
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));
}
