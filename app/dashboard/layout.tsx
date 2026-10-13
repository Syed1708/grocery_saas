import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardShell from "./_components/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.shopId) {
    redirect("/login");
  }

  const { shopId, role, name, shopName, branchId, branchName } = session.user;

  // Fetch all active branches for this store
  const branches = await prisma.branch.findMany({
    where: { shopId, status: "active" },
    select: { id: true, name: true, code: true, isMain: true },
    orderBy: { isMain: "desc" },
  });

  return (
    <DashboardShell
      role={role}
      userName={name || "User"}
      shopName={shopName || "Grocery Store"}
      branches={branches}
      currentBranchId={branchId}
      currentBranchName={branchName}
    >
      {children}
    </DashboardShell>
  );
}