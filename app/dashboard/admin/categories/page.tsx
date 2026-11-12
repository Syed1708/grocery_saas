
import { getCategories } from "@/queries/category-queries";
import CategoriesClient from "./_components/CategoriesClient";
import { requireAuth } from "@/lib/auth/guard";
import { ICategory, PERMISSIONS } from "@/types";

export default async function CategoriesPage() {
  // 🛡️ Zero-Trust Guard: Enforce permissions and active account status
  const user = await requireAuth({
    requiredPermission: PERMISSIONS.CATALOG_VIEW,
    requireActiveStatus: true,
  });

  const { shopId, role } = user;
  const categories = await getCategories(shopId);

  return (
    <div className="max-w-7xl mx-auto">
      <CategoriesClient
        data={categories as ICategory[]}
        userRole={role}
      />
    </div>
  );
}