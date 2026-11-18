import { requireAuth } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import DashboardShell from "./_components/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Authentication & Active Status Guard
  const { shopId, role, userId, activeBranchId: branchId } = await requireAuth({
    requireActiveStatus: true,
  });

  // 2. Resolve display names for the shell
  const [profile, shop] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    prisma.shop.findUnique({ where: { id: shopId }, select: { name: true } }),
  ]);
  const name = profile?.name;
  const shopName = shop?.name;

  // 2. Zero-Trust Branch Query:
  // - OWNER: Can switch between all branches.
  // - MANAGER & CASHIER: Strictly restricted to their assigned branch.
  const branches = await prisma.branch.findMany({
    where: {
      shopId,
      status: "active",
      ...(role !== "OWNER" && branchId ? { id: branchId } : {}), // 👈 Non-owners only see their own branch
    },
    select: { id: true, name: true, code: true, isMain: true },
    orderBy: { isMain: "desc" },
  });

  // 3. Fallback: Resolve active branch cleanly
  const activeBranch = branches.find((b) => b.id === branchId) || branches[0];
  const currentBranchId = activeBranch?.id || branchId;
  const currentBranchName = activeBranch?.name || "Main Branch";

  return (
    <DashboardShell
      role={role}
      userName={name || "User"}
      shopName={shopName || "Grocery Store"}
      branches={branches}
      currentBranchId={currentBranchId}
      currentBranchName={currentBranchName}
    >
      {children}
    </DashboardShell>
  );
}