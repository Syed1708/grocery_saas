"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { saveUploadedFile, deleteUploadedFile } from "@/lib/file-storage";
import { productSchema } from "@/lib/validations";
import { IProduct } from "@/types";
/**
 * Authentication & Authorization Guard
 * Ensures only Store Owners, Admins, and Managers can modify products
 */
async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.shopId) {
    throw new Error("Unauthorized: Please log in.");
  }

  const { role, shopId, id: userId } = session.user;

  const allowedRoles = ["OWNER", "ADMIN", "SUPER_ADMIN", "MANAGER"];
  if (!allowedRoles.includes(role)) {
    throw new Error(
      "Forbidden: You do not have permission to manage products.",
    );
  }

  // Resolve the active branch (either from session or fallback to store's Main Branch)
  let activeBranchId = session.user.branchId;
  if (!activeBranchId) {
    const mainBranch = await prisma.branch.findFirst({
      where: { shopId, isMain: true },
      select: { id: true },
    });
    activeBranchId = mainBranch?.id || null;
  }

  return {
    userId,
    shopId,
    role,
    activeBranchId,
  };
}

/**
 * CREATE PRODUCT ACTION
 * - Validates input using Zod
 * - Auto-generates Barcode and SKU if left blank
 * - Handles image upload to disk
 * - Creates Product and seeds initial branch stock in ProductStock atomically
 */
export async function createProductAction(formData: FormData) {
  try {
    const user = await getAuthenticatedUser();

    // Auto-generate barcode if blank (EAN-13 style random format)
    let barcode = formData.get("barcode")?.toString().trim();
    if (!barcode) {
      barcode = `890${Math.floor(100000000 + Math.random() * 900000000)}`;
    }

    // Auto-generate unique SKU if blank
    let sku = formData.get("sku")?.toString().trim();
    if (!sku) {
      sku = `SKU-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    }

    // 1. Zod Validation
    const validated = productSchema.safeParse({
      name: formData.get("name")?.toString().trim(),
      nameEn: formData.get("nameEn")?.toString().trim() || null,
      barcode,
      sku,
      description: formData.get("description")?.toString().trim() || null,
      costPrice: formData.get("costPrice"),
      sellingPrice: formData.get("sellingPrice"),
      wholesalePrice: formData.get("wholesalePrice") || null,
      vatPercent: formData.get("vatPercent") || 0, // 👈
      expiryDate: formData.get("expiryDate")?.toString() || null, // 👈
      stockQuantity: formData.get("stockQuantity") || 0,
      minStockAlert: formData.get("minStockAlert") || 5,
      unitId: formData.get("unitId")?.toString().trim(),
      categoryId: formData.get("categoryId")?.toString().trim(),
      brandId: formData.get("brandId")?.toString().trim() || null,
      sectionId: formData.get("sectionId")?.toString().trim() || null,
      bulkUnitName: formData.get("bulkUnitName")?.toString().trim() || null,
      conversionFactor: formData.get("conversionFactor") || 1,
      status: formData.get("status")?.toString() || "active", // 👈
    });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const data = validated.data;

    // 2. Uniqueness Checks within the Store
    const existingBarcode = await prisma.product.findUnique({
      where: { shopId_barcode: { shopId: user.shopId, barcode: data.barcode } },
    });
    if (existingBarcode) {
      return {
        success: false,
        error: `Barcode "${data.barcode}" is already assigned to "${existingBarcode.name}".`,
      };
    }

    const existingSku = await prisma.product.findUnique({
      where: { shopId_sku: { shopId: user.shopId, sku: data.sku || "" } },
    });
    if (existingSku) {
      return {
        success: false,
        error: `SKU "${data.sku}" is already assigned to another product.`,
      };
    }

    // 3. Save Uploaded Image to public/uploads/products
    const imageFile = formData.get("image") as File | null;
    let imageUrl = "";
    if (imageFile && imageFile.size > 0) {
      imageUrl = await saveUploadedFile(imageFile, "products");
    }

    // 4. Atomic Database Transaction: Create Product + Seed Branch Stock
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: data.name,
          nameEn: data.nameEn,
          barcode: data.barcode,
          sku: data.sku || sku,
          description: data.description,
          purchasePrice: data.costPrice,
          sellingPrice: data.sellingPrice,
          wholesalePrice: data.wholesalePrice,
          vatPercent: data.vatPercent,
          expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
          alertQuantity: data.minStockAlert,
          bulkUnitName: data.bulkUnitName,
          conversionFactor: data.conversionFactor,
          unitId: data.unitId,
          categoryId: data.categoryId,
          brandId: data.brandId || null,
          sectionId: data.sectionId || null,
          image: imageUrl || null,
          status: data.status,
          shopId: user.shopId,
        },
      });

      // Seed initial stock quantity into ProductStock for active branch
      if (user.activeBranchId && data.stockQuantity > 0) {
        await tx.productStock.create({
          data: {
            productId: product.id,
            branchId: user.activeBranchId,
            quantity: data.stockQuantity,
          },
        });
      }
    });

    revalidatePath("/dashboard/admin/products");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Create product failed:", error);
    return {
      success: false,
      error: error.message || "Failed to create product.",
    };
  }
}

/**
 * UPDATE PRODUCT ACTION
 * - Validates input using Zod
 * - Handles conflict checks for Barcode & SKU
 * - Automatically removes old image from disk when replaced
 * - Updates product metadata and adjusts active branch stock
 */
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
      sku: formData.get("sku")?.toString().trim(),
      description: formData.get("description")?.toString().trim() || null,
      costPrice: formData.get("costPrice"),
      sellingPrice: formData.get("sellingPrice"),
      stockQuantity: formData.get("stockQuantity"),
      minStockAlert: formData.get("minStockAlert"),
      unitId: formData.get("unitId")?.toString().trim(),
      categoryId: formData.get("categoryId")?.toString().trim(),
      brandId: formData.get("brandId")?.toString().trim() || null,
      sectionId: formData.get("sectionId")?.toString().trim() || null,
      bulkUnitName: formData.get("bulkUnitName")?.toString().trim() || null,
      conversionFactor: formData.get("conversionFactor") || 1,
    });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const data = validated.data;

    // 2. Verify Product Existence & Store Ownership
    const currentProduct = await prisma.product.findFirst({
      where: { id, shopId: user.shopId },
    });
    if (!currentProduct) return { success: false, error: "Product not found." };

    // 3. Conflict Checks for Barcode
    if (data.barcode !== currentProduct.barcode) {
      const conflict = await prisma.product.findUnique({
        where: {
          shopId_barcode: { shopId: user.shopId, barcode: data.barcode },
        },
      });
      if (conflict) {
        return {
          success: false,
          error: `Barcode "${data.barcode}" is already in use by "${conflict.name}".`,
        };
      }
    }

    // 4. Handle Image Replacement & Old File Cleanup
    const imageFile = formData.get("image") as File | null;
    let imageUrl = currentProduct.image;

    if (imageFile && imageFile.size > 0) {
      if (currentProduct.image) {
        await deleteUploadedFile(currentProduct.image);
      }
      imageUrl = await saveUploadedFile(imageFile, "products");
    }

    // 5. Atomic Update: Product Details + ProductStock for active branch
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          name: data.name,
          nameEn: data.nameEn,
          barcode: data.barcode,
          sku: data.sku || currentProduct.sku,
          description: data.description,
          purchasePrice: data.costPrice,
          sellingPrice: data.sellingPrice,
          wholesalePrice: data.wholesalePrice,
          vatPercent: data.vatPercent,
          expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
          alertQuantity: data.minStockAlert,
          bulkUnitName: data.bulkUnitName,
          conversionFactor: data.conversionFactor,
          unitId: data.unitId,
          categoryId: data.categoryId,
          brandId: data.brandId || null,
          sectionId: data.sectionId || null,
          image: imageUrl,
          status: data.status,
        },
      });

      // Synchronize stock in active branch if stock was edited
      if (user.activeBranchId && data.stockQuantity !== undefined) {
        await tx.productStock.upsert({
          where: {
            productId_branchId: {
              productId: id,
              branchId: user.activeBranchId,
            },
          },
          update: {
            quantity: data.stockQuantity,
          },
          create: {
            productId: id,
            branchId: user.activeBranchId,
            quantity: data.stockQuantity,
          },
        });
      }
    });

    revalidatePath("/dashboard/admin/products");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Update product failed:", error);
    return {
      success: false,
      error: error.message || "Failed to update product.",
    };
  }
}

/**
 * DELETE PRODUCT ACTION
 * - Verifies product belongs to user's shop
 * - Ensures product cannot be deleted if referenced by sales or purchases
 * - Deletes product image from disk permanently
 * - Deletes associated ProductStock records and Product
 */
export async function deleteProductAction(id: string) {
  try {
    const user = await getAuthenticatedUser();

    const product = await prisma.product.findFirst({
      where: { id, shopId: user.shopId },
      include: {
        _count: {
          select: {
            saleItems: true,
            purchaseItems: true,
          },
        },
      },
    });

    if (!product) return { success: false, error: "Product not found." };

    // Prevent deletion if transactions exist (data integrity guard)
    if (product._count.saleItems > 0 || product._count.purchaseItems > 0) {
      return {
        success: false,
        error: `Cannot delete: This product has historical sales or purchase records. Mark it inactive instead.`,
      };
    }

    // Delete image file from disk
    if (product.image) {
      await deleteUploadedFile(product.image);
    }

    // Delete product stocks and product record
    await prisma.$transaction(async (tx) => {
      await tx.productStock.deleteMany({ where: { productId: id } });
      await tx.product.delete({ where: { id } });
    });

    revalidatePath("/dashboard/admin/products");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Delete product failed:", error);
    return {
      success: false,
      error: error.message || "Failed to delete product.",
    };
  }
}
