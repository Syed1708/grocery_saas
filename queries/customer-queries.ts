import { prisma } from "@/lib/prisma";
import { ICustomer } from "@/types";

export async function getCustomers(shopId: string): Promise<ICustomer[]> {
  const customers = await prisma.customer.findMany({
    where: { shopId },
    orderBy: { createdAt: "desc" },
  });

  // 👈 Ensure plain numbers instead of Prisma Decimals
  return customers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    type: c.type,
    village: c.village,
    district: c.district,
    address: c.address,
    creditLimit: Number(c.creditLimit || 0),
    currentBalance: Number(c.currentDue || 0),
    shopId: c.shopId,
    createdAt: c.createdAt,
  }));
}