import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SettingsClient from "./_components/SettingsClient";
import { IShopSettings, IBranchSettings } from "@/types/settings";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.shopId) {
    redirect("/login");
  }

  const { shopId } = session.user;
  const activeBranchId = session.user.branchId;

  const [shop, branches] = await Promise.all([
    prisma.shop.findUnique({
      where: { id: shopId },
    }),
    prisma.branch.findMany({
      where: { shopId },
      include: {
        _count: {
          select: { users: true, sales: true },
        },
      },
      orderBy: { isMain: "desc" },
    }),
  ]);

  if (!shop) {
    redirect("/login");
  }

  // 👈 RESOLVE ACTIVE BRANCH (or fallback to Main Branch)
  const activeBranch =
    branches.find((b) => b.id === activeBranchId) ||
    branches.find((b) => b.isMain) ||
    branches[0];

  const formattedShop: IShopSettings = {
    ...shop,
    vatPercent: Number(shop.vatPercent),
  };

  const formattedBranches: IBranchSettings[] = branches.map((b) => ({
    ...b,
    _count: b._count,
  }));

  return (
    <div className="max-w-7xl mx-auto">
      <SettingsClient
        shop={formattedShop}
        branches={formattedBranches}
        activeBranch={activeBranch}
        userRole={session.user.role} // 👈 Pass userRole here
      />
    </div>
  );
}