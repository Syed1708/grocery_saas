import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { redirect } from "next/navigation";
import { getUnits } from "@/queries/unit-queries";
import UnitsClient from "./_components/UnitsClient";

export default async function UnitsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.shopId) {
    redirect("/login");
  }

  const units = await getUnits(session.user.shopId);

  return (
    <div className="max-w-7xl mx-auto">
      <UnitsClient data={units} />
    </div>
  );
}