import { prisma } from "@/lib/prisma";
import { ICustomer } from "@/types";

export async function getCustomers(shopId: string): Promise<ICustomer[]> {
  const customers = await prisma.customer.findMany({
    where: { shopId },
    orderBy: { createdAt: "desc" },
  });

  return customers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    type: c.type,
    village: c.village,
    district: c.district,
    addressLine: c.addressLine,
    creditLimit: Number(c.creditLimit),
    currentBalance: Number(c.currentBalance),
    shopId: c.shopId,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));
}