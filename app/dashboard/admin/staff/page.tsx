import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import {
  getDepartments,
  getStaffList,
  getAdvances,
  getPayrolls,
} from "@/queries/staff-queries";
import StaffClient from "./_components/StaffClient";
import { prisma } from "@/lib/prisma";

export default async function StaffPage() {
  const { shopId, activeBranchId } = await requireAuth({
    requiredPermission: PERMISSIONS.STAFF_MANAGE,
    requireActiveStatus: true,
  });

  // 🚀 Fast parallel server queries (staff/advances/payrolls scoped to active branch)
  const [departments, staff, advances, payrolls, shop] = await Promise.all([
    getDepartments(shopId),
    getStaffList(shopId, activeBranchId),
    getAdvances(shopId, activeBranchId),
    getPayrolls(shopId, activeBranchId),
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