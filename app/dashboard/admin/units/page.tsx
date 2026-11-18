import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import { getUnits } from "@/queries/unit-queries";
import UnitsClient from "./_components/UnitsClient";

export default async function UnitsPage() {
  // 🛡️ Zero-Trust Guard: Enforce permission and active account status
  const user = await requireAuth({
    requiredPermission: PERMISSIONS.CATALOG_VIEW,
    requireActiveStatus: true,
  });

  const units = await getUnits(user.shopId);

  return (
    <div className="max-w-7xl mx-auto">
      <UnitsClient data={units} />
    </div>
  );
}
