import { requireAuth } from "@/lib/auth/guard";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProfileClient from "./_components/ProfileClient";

export default async function ProfilePage() {
  const { userId } = await requireAuth({ requireActiveStatus: true });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      shop: { select: { name: true } },
      branch: { select: { name: true } },
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <ProfileClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage,
        shopName: user.shop.name,
        branchName: user.branch?.name || "Main Branch",
      }}
    />
  );
}