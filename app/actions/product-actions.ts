"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { saveUploadedFile, deleteUploadedFile } from "@/lib/file-storage";
import { productSchema } from "@/lib/validations";

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.shopId) {
    throw new Error("Unauthorized: Please log in.");
  }
  if (session.user.role !== "OWNER" && session.user.role !== "MANAGER") {
    throw new Error("Forbidden: Only Owners and Managers can modify products.");
  }
  return session.user;
}

export async function createProductAction(formData: FormData) {
  try {
    const user = await getAuthenticatedUser();

    // Generate random 12-digit barcode if blank
    let barcode = formData.get("barcode")?.toString().trim();
    if (!barcode) {
      barcode = `890${Math.floor(100000000 + Math.random() * 900000000)}`;
    }

    // 1. Zod Validation
    const validated = productSchema.safeParse({
      name: formData.get("name")?.toString().trim(),
      barcode,
      description: formData.get("description")?.toString().trim() || null,
      costPrice: formData.get("costPrice"),
      sellingPrice: formData.get("sellingPrice"),
      stockQuantity: formData.get("stockQuantity") || 0,
      minStockAlert: formData.get("minStockAlert") || 5,
      unitId: formData.get("unitId")?.toString().trim(),
      categoryId: formData.get("categoryId")?.toString().trim(),
      bulkUnitName: formData.get("bulkUnitName")?.toString().trim() || null,
      conversionFactor: formData.get("conversionFactor") || 1,
    });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const data = validated.data;

    // 2. Check Barcode Uniqueness within this store
    const existing = await prisma.product.findUnique({
      where: { shopId_barcode: { shopId: user.shopId, barcode: data.barcode } },
    });
    if (existing) {
      return { success: false, error: `Barcode "${data.barcode}" is already assigned to "${existing.name}".` };
    }

    // 3. Save Uploaded Product Image
    const imageFile = formData.get("image") as File | null;
    let imageUrl = "";
    if (imageFile && imageFile.size > 0) {
      imageUrl = await saveUploadedFile(imageFile, "products");
    }

    // 4. Save to MySQL
    await prisma.product.create({
      data: {
        ...data,
        image: imageUrl || null,
        shopId: user.shopId,
      },
    });

    revalidatePath("/dashboard/admin/products");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create product." };
  }
}

export async function updateProductAction(formData: FormData) {
  try {
    const user = await getAuthenticatedUser();

    const id = formData.get("id")?.toString();
    if (!id) return { success: false, error: "Missing product ID." };

    // 1. Zod Validation
    const validated = productSchema.safeParse({
      id,
      name: formData.get("name")?.toString().trim(),
      barcode: formData.get("barcode")?.toString().trim(),
      description: formData.get("description")?.toString().trim() || null,
      costPrice: formData.get("costPrice"),
      sellingPrice: formData.get("sellingPrice"),
      stockQuantity: formData.get("stockQuantity"),
      minStockAlert: formData.get("minStockAlert"),
      unitId: formData.get("unitId")?.toString().trim(),
      categoryId: formData.get("categoryId")?.toString().trim(),
      bulkUnitName: formData.get("bulkUnitName")?.toString().trim() || null,
      conversionFactor: formData.get("conversionFactor") || 1,
    });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const data = validated.data;

    const currentProduct = await prisma.product.findFirst({
      where: { id, shopId: user.shopId },
    });
    if (!currentProduct) return { success: false, error: "Product not found." };

    // 2. Barcode Conflict Check
    if (data.barcode !== currentProduct.barcode) {
      const conflict = await prisma.product.findUnique({
        where: { shopId_barcode: { shopId: user.shopId, barcode: data.barcode } },
      });
      if (conflict) {
        return { success: false, error: `Barcode "${data.barcode}" is already used by "${conflict.name}".` };
      }
    }

    // 3. Image Replacement Cleanup
    const imageFile = formData.get("image") as File | null;
    let imageUrl = currentProduct.image;

    if (imageFile && imageFile.size > 0) {
      if (currentProduct.image) {
        await deleteUploadedFile(currentProduct.image);
      }
      imageUrl = await saveUploadedFile(imageFile, "products");
    }

    // 4. Update in MySQL
    await prisma.product.update({
      where: { id },
      data: {
        ...data,
        image: imageUrl,
      },
    });

    revalidatePath("/dashboard/admin/products");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update product." };
  }
}

export async function deleteProductAction(id: string) {
  try {
    const user = await getAuthenticatedUser();

    const product = await prisma.product.findFirst({
      where: { id, shopId: user.shopId },
    });
    if (!product) return { success: false, error: "Product not found." };

    // Delete photo from disk
    if (product.image) {
      await deleteUploadedFile(product.image);
    }

    await prisma.product.delete({
      where: { id },
    });

    revalidatePath("/dashboard/admin/products");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete product." };
  }
}