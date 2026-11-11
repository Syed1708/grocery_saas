"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import { ReorderSuggestionItem } from "@/types/purchase-order";

// ==========================================
// 1. GET REORDER SUGGESTIONS FOR A SUPPLIER
// ==========================================
export async function getSupplierReorderSuggestionsAction(supplierId: string) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });

    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, shopId: user.shopId },
    });
    if (!supplier) return { success: false, error: "সাপ্লায়ার পাওয়া যায়নি।" };

    const companyKeyword = (supplier.companyName || supplier.name || "")
      .split(/\s+/)[0]
      ?.trim();

    let products = await prisma.product.findMany({
      where: {
        shopId: user.shopId,
        status: "active",
        OR: [
          {
            purchaseItems: {
              some: {
                purchase: {
                  supplierId,
                },
              },
            },
          },
          ...(companyKeyword && companyKeyword.length >= 3
            ? [
                {
                  brand: {
                    name: {
                      contains: companyKeyword,
                    },
                  },
                },
                {
                  name: {
                    contains: companyKeyword,
                  },
                },
              ]
            : []),
        ],
      },
      include: {
        stocks: {
          where: { branchId: user.activeBranchId! },
          select: { quantity: true },
        },
        unit: { select: { shortCode: true } },
      },
      orderBy: { name: "asc" },
    });

    if (products.length === 0) {
      products = await prisma.product.findMany({
        where: {
          shopId: user.shopId,
          status: "active",
        },
        include: {
          stocks: {
            where: { branchId: user.activeBranchId! },
            select: { quantity: true },
          },
          unit: { select: { shortCode: true } },
        },
        take: 100,
        orderBy: { name: "asc" },
      });
    }

    const suggestions: ReorderSuggestionItem[] = products.map((p) => {
      const stock = Number(p.stocks[0]?.quantity || 0);
      const minAlert = Number(p.alertQuantity || 5);
      const cost = Number(p.purchasePrice || 0);
      const suggestedQty = Math.max(1, minAlert * 2 - stock);

      return {
        id: p.id,
        name: p.name,
        barcode: p.barcode || "",
        unitCode: p.unit?.shortCode || "pcs",
        currentStock: stock,
        minStockAlert: minAlert,
        unitCost: cost,
        suggestedQty,
      };
    });

    // 🛡️ Sanitize Decimal fields into plain numbers before sending to client
    const serializedSupplier = {
      id: supplier.id,
      name: supplier.name,
      companyName: supplier.companyName,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      openingDue: Number(supplier.openingDue || 0),
      currentDue: Number(supplier.currentDue || 0),
      status: supplier.status,
    };

    return {
      success: true,
      suggestions,
      supplier: serializedSupplier,
    };
  } catch (error: any) {
    console.error("Reorder suggestions error:", error);
    return { success: false, error: error.message };
  }
}

// ==========================================
// 2. CREATE PURCHASE ORDER (DRAFT PO)
// ==========================================
export async function createPurchaseOrderAction(payload: {
  supplierId: string;
  notes?: string;
  items: { productId: string; quantity: number; unitCost: number }[];
}) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });

    const { supplierId, notes, items } = payload;
    if (!supplierId || !items || items.length === 0) {
      return { success: false, error: "সাপ্লায়ার এবং কমপক্ষে একটি পণ্য আবশ্যক।" };
    }

    const orderNo = `PO-${Date.now().toString().slice(-6)}`;
    let estimatedTotal = 0;

    for (const it of items) {
      estimatedTotal += Number(it.quantity) * Number(it.unitCost);
    }

    const po = await prisma.purchaseOrder.create({
      data: {
        orderNo,
        supplierId,
        branchId: user.activeBranchId!,
        shopId: user.shopId,
        totalItems: items.length,
        estimatedTotal,
        notes: notes || null,
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitCost: i.unitCost,
            lineTotal: i.quantity * i.unitCost,
          })),
        },
      },
    });

    revalidatePath("/purchases");
    return { success: true, orderNo: po.orderNo, id: po.id };
  } catch (error: any) {
    console.error("Create PO error:", error);
    return { success: false, error: error.message };
  }
}

// ==========================================
// 3. UPDATE PURCHASE ORDER (DRAFT ONLY)
// ==========================================
export async function updatePurchaseOrderAction(payload: {
  id: string;
  notes?: string;
  items: { productId: string; quantity: number; unitCost: number }[];
}) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });

    const { id, notes, items } = payload;
    const existing = await prisma.purchaseOrder.findFirst({
      where: { id, shopId: user.shopId },
    });

    if (!existing) return { success: false, error: "অর্ডার পাওয়া যায়নি।" };
    if (existing.status === "CONVERTED") {
      return { success: false, error: "ইতিমধ্যেই চালানে রূপান্তরিত অর্ডার সম্পাদনা করা যাবে না।" };
    }

    let estimatedTotal = 0;
    for (const it of items) {
      estimatedTotal += Number(it.quantity) * Number(it.unitCost);
    }

    await prisma.$transaction(async (tx) => {
      await tx.purchaseOrderItem.deleteMany({ where: { orderId: id } });

      await tx.purchaseOrder.update({
        where: { id },
        data: {
          totalItems: items.length,
          estimatedTotal,
          notes: notes || null,
          items: {
            create: items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              unitCost: i.unitCost,
              lineTotal: i.quantity * i.unitCost,
            })),
          },
        },
      });
    });

    revalidatePath("/purchases");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==========================================
// 4. DELETE / CANCEL PURCHASE ORDER
// ==========================================
export async function deletePurchaseOrderAction(orderId: string) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.CATALOG_MANAGE,
      requireActiveStatus: true,
    });

    const po = await prisma.purchaseOrder.findFirst({
      where: { id: orderId, shopId: user.shopId },
    });

    if (!po) return { success: false, error: "অর্ডার পাওয়া যায়নি।" };
    if (po.status === "CONVERTED") {
      return { success: false, error: "চালানে রূপান্তরিত অর্ডার মোছা সম্ভব নয়।" };
    }

    await prisma.purchaseOrder.delete({
      where: { id: orderId },
    });

    revalidatePath("/purchases");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}