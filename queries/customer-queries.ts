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
    address: c.address,
    creditLimit: Number(c.creditLimit),
    currentBalance: Number(c.currentDue), // 👈 Maps currentDue to currentBalance for the UI
    shopId: c.shopId,
    createdAt: c.createdAt,
  }));
}