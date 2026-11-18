import { requireAuth } from "@/lib/auth/guard";
import {
  getDepartments,
  getStaffList,
  getAdvances,
  getPayrolls,
} from "@/queries/staff-queries";
import StaffClient from "./_components/StaffClient";
import { prisma } from "@/lib/prisma";

export default async function StaffPage() {
  const { shopId } = await requireAuth({
    allowedRoles: ["OWNER", "MANAGER"],
    requireActiveStatus: true,
  });

  // 🚀 Fast parallel server queries
  const [departments, staff, advances, payrolls, shop] = await Promise.all([
    getDepartments(shopId),
    getStaffList(shopId),
    getAdvances(shopId),
    getPayrolls(shopId),
    prisma.shop.findUnique({
      where: { id: shopId },
      select: { currencySymbol: true },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <StaffClient
        departments={departments}
        staff={staff}
        advances={advances}
        payrolls={payrolls}
        currencySymbol={shop?.currencySymbol || "৳"}
      />
    </div>
  );
}