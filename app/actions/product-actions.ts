// app/actions/product-actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import { saveUploadedFile, deleteUploadedFile } from "@/lib/file-storage";
import { productSchema } from "@/lib/validations";

// ==========================================
// 1. CREATE PRODUCT
// ==========================================
export async function createProductAction(formData: FormData) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });

    if (!user.activeBranchId) {
      return { success: false, error: "সক্রিয় ব্রাঞ্চ পাওয়া যায়নি।" };
    }

    let barcode = formData.get("barcode")?.toString().trim();
    if (!barcode) {
      barcode = `890${Math.floor(100000000 + Math.random() * 900000000)}`;
    }

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
      vatPercent: formData.get("vatPercent") || 0,
      expiryDate: formData.get("expiryDate")?.toString() || null,
      stockQuantity: formData.get("stockQuantity") || 0,
      minStockAlert: formData.get("minStockAlert") || 5,
      unitId: formData.get("unitId")?.toString().trim(),
      categoryId: formData.get("categoryId")?.toString().trim(),
      brandId: formData.get("brandId")?.toString().trim() || null,
      sectionId: formData.get("sectionId")?.toString().trim() || null,
      bulkUnitName: formData.get("bulkUnitName")?.toString().trim() || null,
      conversionFactor: formData.get("conversionFactor") || 1,
      status: formData.get("status")?.toString() || "active",
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
        error: `বারকোড "${data.barcode}" ইতোমধ্যে "${existingBarcode.name}" পণ্যে ব্যবহৃত হচ্ছে।`,
      };
    }

    const existingSku = await prisma.product.findUnique({
      where: { shopId_sku: { shopId: user.shopId, sku: data.sku || sku } },
    });
    if (existingSku) {
      return {
        success: false,
        error: `SKU "${data.sku}" ইতোমধ্যে অন্য পণ্যে ব্যবহৃত হচ্ছে।`,
      };
    }

    // 3. Image Upload
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
    revalidatePath("/pos");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Create product failed:", error);
    return { success: false, error: error.message || "পণ্য তৈরি করতে ব্যর্থ হয়েছে।" };
  }
}

// ==========================================
// 2. UPDATE PRODUCT (Zero Data-Loss Fix)
// ==========================================
export async function updateProductAction(formData: FormData) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });

    const id = formData.get("id")?.toString();
    if (!id) return { success: false, error: "পণ্য আইডি পাওয়া যায়নি।" };

    // 1. 🛡️ COMPLETE Zod Validation (Includes all previously omitted fields!)
    const validated = productSchema.safeParse({
      id,
      name: formData.get("name")?.toString().trim(),
      nameEn: formData.get("nameEn")?.toString().trim() || null,
      barcode: formData.get("barcode")?.toString().trim(),
      sku: formData.get("sku")?.toString().trim(),
      description: formData.get("description")?.toString().trim() || null,
      costPrice: formData.get("costPrice"),
      sellingPrice: formData.get("sellingPrice"),
      wholesalePrice: formData.get("wholesalePrice") || null,
      vatPercent: formData.get("vatPercent") || 0,
      expiryDate: formData.get("expiryDate")?.toString() || null,
      minStockAlert: formData.get("minStockAlert"),
      unitId: formData.get("unitId")?.toString().trim(),
      categoryId: formData.get("categoryId")?.toString().trim(),
      brandId: formData.get("brandId")?.toString().trim() || null,
      sectionId: formData.get("sectionId")?.toString().trim() || null,
      bulkUnitName: formData.get("bulkUnitName")?.toString().trim() || null,
      conversionFactor: formData.get("conversionFactor") || 1,
      status: formData.get("status")?.toString() || "active",
    });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const data = validated.data;

    // 2. Verify Product Existence & Store Ownership
    const currentProduct = await prisma.product.findFirst({
      where: { id, shopId: user.shopId },
    });
    if (!currentProduct) return { success: false, error: "পণ্যটি খুঁজে পাওয়া যায়নি।" };

    // 3. Conflict Checks for Barcode
    if (data.barcode !== currentProduct.barcode) {
      const conflict = await prisma.product.findUnique({
        where: { shopId_barcode: { shopId: user.shopId, barcode: data.barcode } },
      });
      if (conflict) {
        return {
          success: false,
          error: `বারকোড "${data.barcode}" ইতোমধ্যে "${conflict.name}" পণ্যে ব্যবহৃত হচ্ছে।`,
        };
      }
    }

    // 4. Handle Image Replacement
    const imageFile = formData.get("image") as File | null;
    let imageUrl = currentProduct.image;

    if (imageFile && imageFile.size > 0) {
      if (currentProduct.image) {
        try {
          await deleteUploadedFile(currentProduct.image);
        } catch {}
      }
      imageUrl = await saveUploadedFile(imageFile, "products");
    }

    // 5. 🛡️ ATOMIC UPDATE (Preserves All Pricing, Expiry, and Status Attributes!)
    await prisma.product.update({
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

    revalidatePath("/dashboard/admin/products");
    revalidatePath("/pos");
    revalidatePath("/reports/stock");
    return { success: true };
  } catch (error: any) {
    console.error("Update product failed:", error);
    return { success: false, error: error.message || "পণ্য আপডেট ব্যর্থ হয়েছে।" };
  }
}

// ==========================================
// 3. DELETE PRODUCT (Safe Guarded)
// ==========================================
export async function deleteProductAction(id: string) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });

    if (user.role !== "OWNER") {
      return { success: false, error: "অনুমতি নেই: শুধুমাত্র দোকানের মালিক পণ্য মুছে ফেলতে পারেন।" };
    }

    const product = await prisma.product.findFirst({
      where: { id, shopId: user.shopId },
      include: {
        _count: {
          select: {
            saleItems: true,
            purchaseItems: true,
            saleReturnItems: true,
          },
        },
      },
    });

    if (!product) return { success: false, error: "পণ্য পাওয়া যায়নি।" };

    // Prevent deletion if transaction history exists
    if (
      product._count.saleItems > 0 ||
      product._count.purchaseItems > 0 ||
      product._count.saleReturnItems > 0
    ) {
      return {
        success: false,
        error: `মুছে ফেলা সম্ভব নয়: এই পণ্যের পূর্বের বিক্রয় বা ক্রয় চালান রয়েছে। পণ্যটি নিষ্ক্রিয় (Inactive) করুন।`,
      };
    }

    if (product.image) {
      try {
        await deleteUploadedFile(product.image);
      } catch {}
    }

    await prisma.$transaction(async (tx) => {
      await tx.productStock.deleteMany({ where: { productId: id } });
      await tx.product.delete({ where: { id } });
    });

    revalidatePath("/dashboard/admin/products");
    revalidatePath("/pos");
    revalidatePath("/reports/stock");
    return { success: true };
  } catch (error: any) {
    console.error("Delete product failed:", error);
    return { success: false, error: error.message || "পণ্য মুছে ফেলা সম্ভব হয়নি।" };
  }
}

// ==========================================
// 4. STOCK ADJUSTMENT & WASTAGE ENGINE
// ==========================================
export interface StockAdjustmentPayload {
  productId: string;
  adjustmentType: "CORRECTION" | "DAMAGE" | "EXPIRED" | "LOST";
  newQuantity: number;
  reasonNotes?: string;
}

export async function adjustStockAction(payload: StockAdjustmentPayload) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });

    if (!user.activeBranchId) {
      return { success: false, error: "সক্রিয় ব্রাঞ্চ পাওয়া যায়নি।" };
    }

    const { productId, adjustmentType, newQuantity, reasonNotes } = payload;
    const sNewQuantity = Math.max(0, Number(newQuantity) || 0);

    const product = await prisma.product.findFirst({
      where: { id: productId, shopId: user.shopId },
      include: {
        stocks: { where: { branchId: user.activeBranchId } },
      },
    });

    if (!product) return { success: false, error: "পণ্য পাওয়া যায়নি।" };

    const currentStock = Number(product.stocks[0]?.quantity ?? 0);
    const difference = sNewQuantity - currentStock;

    if (difference === 0) {
      return { success: false, error: "নতুন স্টক পূর্বের স্টকের সমান। কোনো পরিবর্তন হয়নি।" };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update ProductStock in the active branch
      await tx.productStock.upsert({
        where: {
          productId_branchId: {
            productId,
            branchId: user.activeBranchId,
          },
        },
        update: { quantity: sNewQuantity },
        create: {
          productId,
          branchId: user.activeBranchId,
          quantity: sNewQuantity,
        },
      });

      // 2. If adjusting downwards due to DAMAGE, EXPIRED, or LOST: Log automated wastage expense!
      if (difference < 0 && adjustmentType !== "CORRECTION") {
        const lossUnits = Math.abs(difference);
        const unitCost = Number(product.purchasePrice || 0);
        const totalWastageLoss = Math.round(lossUnits * unitCost * 100) / 100;

        if (totalWastageLoss > 0) {
          let damageCat = await tx.expenseCategory.findFirst({
            where: { shopId: user.shopId, code: "EXP-DAMAGE" },
          });

          if (!damageCat) {
            damageCat = await tx.expenseCategory.create({
              data: {
                name: "নষ্ট ও মেয়াদোত্তীর্ণ পণ্যের ক্ষতি (Damaged Goods Write-Off)",
                code: "EXP-DAMAGE",
                description: "ইনভেন্টরি স্টক সমন্বয় থেকে প্রাপ্ত ঘাটতি ও নষ্ট পণ্যের ক্ষতি",
                shopId: user.shopId,
                status: "active",
              },
            });
          }

          await tx.expense.create({
            data: {
              voucherNo: `VCH-ADJ-${Date.now().toString().slice(-6)}`,
              amount: totalWastageLoss,
              expenseDate: new Date(),
              paymentMethod: "non_cash",
              reference: `Stock Adjust: ${product.name} (${adjustmentType})`,
              note: `স্টক সমন্বয় বাবদ ${lossUnits} টি পণ্যের ক্রয়মূল্য ক্ষতি। মন্তব্য: ${reasonNotes || "N/A"}`,
              categoryId: damageCat.id,
              branchId: user.activeBranchId,
              shopId: user.shopId,
              userId: user.userId,
            },
          });
        }
      }
    });

    revalidatePath("/dashboard/admin/products");
    revalidatePath("/reports/stock");
    revalidatePath("/pos");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error: any) {
    console.error("Stock adjustment error:", error);
    return { success: false, error: error.message || "স্টক সমন্বয় করতে ব্যর্থ হয়েছে।" };
  }
}