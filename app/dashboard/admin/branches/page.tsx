import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BranchesClient from "./_components/BranchesClient";

export default async function BranchesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.shopId) {
    redirect("/login");
  }

  const branches = await prisma.branch.findMany({
    where: { shopId: session.user.shopId },
    include: {
      _count: {
        select: { users: true, sales: true },
      },
    },
    orderBy: { isMain: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto">
      <BranchesClient data={branches as any} />
    </div>
  );
}