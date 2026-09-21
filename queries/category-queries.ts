import { dbConnect } from "@/services/dbConnect";
import { Category } from "@/models/Category";
import { ICategory } from "@/types/category";

interface GetCategoriesParams {
  shopId: string;
  search?: string;
}

export async function getCategories({
  shopId,
  search = "",
}: GetCategoriesParams): Promise<ICategory[]> {
  await dbConnect();

  const query: any = { shopId };

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  const categories = await Category.find(query)
    .sort({ createdAt: -1 })
    .lean();

  // Return clean serializable JSON for React Server Components
  return JSON.parse(JSON.stringify(categories));
}

export async function getCategoryById(
  id: string,
  shopId: string
): Promise<ICategory | null> {
  await dbConnect();
  const category = await Category.findOne({ _id: id, shopId }).lean();
  if (!category) return null;
  return JSON.parse(JSON.stringify(category));
}