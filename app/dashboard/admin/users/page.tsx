// app/(dashboard)/admin/users/page.tsx
import { requireAuth } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import UsersClientView from "./_components/UsersClient";

export const metadata = {
  title: "Staff & Users Management | Grocery SaaS ERP",
};

export default async function AdminUsersPage() {
  const { shopId } = await requireAuth({
    allowedRoles: ["OWNER"],
  });

  const [users, branches] = await Promise.all([
    prisma.user.findMany({
      where: { 
        shopId, 
        role: { not: "OWNER" } // 👈 Protects admin: Owners are hidden from the staff list
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.branch.findMany({
      where: { shopId, status: "active" },
      select: { id: true, name: true, code: true },
      orderBy: { isMain: "desc" },
    }),
  ]);

  const formattedUsers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    isActive: u.isActive,
    branchId: u.branchId,
    branchName: u.branch?.name ?? "Unassigned",
    hasSupervisorPin: Boolean(u.supervisorPin),
    customPermissions: Array.isArray(u.customPermissions)
      ? (u.customPermissions as string[])
      : [],
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <UsersClientView initialUsers={formattedUsers} branches={branches} />
    </div>
  );
}