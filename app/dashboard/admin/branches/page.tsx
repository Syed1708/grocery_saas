import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import { prisma } from "@/lib/prisma";
import BranchesClient from "./_components/BranchesClient";
import { IBranchWithCounts } from "@/types";

export default async function BranchesPage() {
  // 🛡️ Zero-Trust Guard: Enforce permissions and active status
  const user = await requireAuth({
    requiredPermission: PERMISSIONS.CATALOG_MANAGE,
    requireActiveStatus: true,
  });

  const { shopId, role } = user;

  const branches = await prisma.branch.findMany({
    where: { shopId },
    include: {
      _count: {
        select: { users: true, sales: true },
      },
    },
    orderBy: [
      { isMain: "desc" },
      { createdAt: "asc" },
    ],
  });

  return (
    <div className="max-w-7xl mx-auto">
      <BranchesClient
        data={branches as IBranchWithCounts[]}
        userRole={role}
      />
    </div>
  );
}