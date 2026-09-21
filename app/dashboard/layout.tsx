import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { redirect } from "next/navigation";
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

  return (
    <DashboardShell
      role={session.user.role}
      userName={session.user.name || "User"}
      shopName={session.user.shopName || "Grocery Store"}
    >
      {children}
    </DashboardShell>
  );
}