import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { redirect } from "next/navigation";
import { getCategories } from "@/queries/category-queries";
import CategoryDialog from "./_components/CategoryDialog";
import DeleteCategoryButton from "./_components/DeleteCategoryButton";
import CategorySearch from "./_components/CategorySearch";
import Image from "next/image";

interface PageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function CategoriesPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.shopId) {
    redirect("/login");
  }

  const { search = "" } = await searchParams;
  const categories = await getCategories({
    shopId: session.user.shopId,
    search,
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500">
            Organize products for faster grocery and POS operations
          </p>
        </div>
        <CategoryDialog mode="create" />
      </div>

      {/* Filter Bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <CategorySearch />
        <span className="text-sm text-gray-500">
          Total: <strong>{categories.length}</strong> categories
        </span>
      </div>

      {/* Category Grid */}
      {categories.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500">No categories found.</p>
          <p className="text-sm text-gray-400 mt-1">
            Click &quot;Add Category&quot; above to create your first grocery category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <div
              key={cat._id?.toString()}
              className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="h-36 w-full bg-gray-100 relative overflow-hidden flex items-center justify-center">
                  {cat.image ? (
                    <Image
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl text-gray-400">📦</span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 text-lg">{cat.name}</h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {cat.description || "No description provided."}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0 border-t border-gray-50 flex items-center justify-end gap-2 mt-2">
                <CategoryDialog mode="edit" category={cat} />
                <DeleteCategoryButton id={cat._id!.toString()} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}