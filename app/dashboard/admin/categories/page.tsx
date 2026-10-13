import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { redirect } from "next/navigation";
import { getCategories } from "@/queries/category-queries";
import CategoriesClient from "./_components/CategoriesClient";

export default async function CategoriesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.shopId) {
    redirect("/login");
  }

  const categories = await getCategories(session.user.shopId);

  return (
    <div className="max-w-7xl mx-auto">
      <CategoriesClient data={categories} />
    </div>
  );
}