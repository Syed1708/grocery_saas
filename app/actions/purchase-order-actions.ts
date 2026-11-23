"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import { getErrorMessage } from "@/lib/utils";
import { ReorderSuggestionItem } from "@/types/purchase-order";

const PO_REVALIDATE_PATHS = [
  "/dashboard/admin/purchases",
  "/dashboard/admin/reports/purchases",
];

function revalidateOrders() {
  for (const path of PO_REVALIDATE_PATHS) revalidatePath(path);
}

interface OrderLine {
  productId: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

async function buildOrderLines(
  shopId: string,
  items: { productId: string; quantity: number; unitCost: number }[]
): Promise<OrderLine[]> {
  if (!items || items.length === 0) {
    throw new Error("কমপক্ষে একটি পণ্য আবশ্যক।");
  }

  const productIds = [...new Set(items.map((item) => item.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, shopId, status: "active" },
    select: { id: true },
  });
  const validIds = new Set(products.map((product) => product.id));
  const lineMap = new Map<string, OrderLine>();

  for (const item of items) {
    if (!validIds.has(item.productId)) {
      throw new Error("পণ্য পাওয়া যায়নি বা এই দোকানের নয়।");
    }
    const quantity = Number(item.quantity);
    const unitCost = Number(item.unitCost);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error("পণ্যের পরিমাণ শূন্যের বেশি হতে হবে।");
    }
    if (!Number.isFinite(unitCost) || unitCost < 0) {
      throw new Error("ক্রয়মূল্য সঠিক নয়।");
    }

    const existing = lineMap.get(item.productId);
    const totalQty = (existing?.quantity || 0) + quantity;
    lineMap.set(item.productId, {
      productId: item.productId,
      quantity: totalQty,
      unitCost,
      lineTotal: Math.round(totalQty * unitCost * 100) / 100,
    });
  }

  return [...lineMap.values()];
}

// ==========================================
// 1. GET REORDER SUGGESTIONS FOR A SUPPLIER
// ==========================================
export async function getSupplierReorderSuggestionsAction(supplierId: string) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.PURCHASES_VIEW,
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
                  branchId: user.activeBranchId,
                  shopId: user.shopId,
                },
              },
            },
          },
          ...(companyKeyword && companyKeyword.length >= 3
            ? [
                { brand: { name: { contains: companyKeyword } } },
                { name: { contains: companyKeyword } },
              ]
            : []),
        ],
      },
      include: {
        stocks: {
          where: { branchId: user.activeBranchId },
          select: { quantity: true },
        },
        unit: { select: { shortCode: true } },
      },
      orderBy: { name: "asc" },
    });

    if (products.length === 0) {
      products = await prisma.product.findMany({
        where: { shopId: user.shopId, status: "active" },
        include: {
          stocks: {
            where: { branchId: user.activeBranchId },
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

    return { success: true, suggestions, supplier: serializedSupplier };
  } catch (error) {
    console.error("Reorder suggestions error:", error);
    return { success: false, error: getErrorMessage(error, "Failed to load reorder suggestions.") };
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
      requiredPermission: PERMISSIONS.PURCHASES_MANAGE,
      requireActiveStatus: true,
    });

    const { supplierId, notes, items } = payload;
    if (!supplierId) {
      return { success: false, error: "সাপ্লায়ার আবশ্যক।" };
    }

    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, shopId: user.shopId },
      select: { id: true },
    });
    if (!supplier) return { success: false, error: "সাপ্লায়ার পাওয়া যায়নি।" };

    const lines = await buildOrderLines(user.shopId, items);
    const estimatedTotal =
      Math.round(lines.reduce((sum, line) => sum + line.lineTotal, 0) * 100) / 100;
    const orderNo = `PO-${Date.now().toString().slice(-6)}`;

    const po = await prisma.purchaseOrder.create({
      data: {
        orderNo,
        supplierId,
        branchId: user.activeBranchId,
        shopId: user.shopId,
        totalItems: lines.length,
        estimatedTotal,
        notes: notes || null,
        items: {
          create: lines.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            unitCost: line.unitCost,
            lineTotal: line.lineTotal,
          })),
        },
      },
    });

    revalidateOrders();
    return { success: true, orderNo: po.orderNo, id: po.id };
  } catch (error) {
    console.error("Create PO error:", error);
    return { success: false, error: getErrorMessage(error, "অর্ডার তৈরি করা সম্ভব হয়নি।") };
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
      requiredPermission: PERMISSIONS.PURCHASES_MANAGE,
      requireActiveStatus: true,
    });

    const { id, notes, items } = payload;
    const existing = await prisma.purchaseOrder.findFirst({
      where: { id, shopId: user.shopId, branchId: user.activeBranchId },
    });

    if (!existing) return { success: false, error: "অর্ডার পাওয়া যায়নি।" };
    if (existing.status === "CONVERTED") {
      return { success: false, error: "ইতিমধ্যেই চালানে রূপান্তরিত অর্ডার সম্পাদনা করা যাবে না।" };
    }

    const lines = await buildOrderLines(user.shopId, items);
    const estimatedTotal =
      Math.round(lines.reduce((sum, line) => sum + line.lineTotal, 0) * 100) / 100;

    await prisma.$transaction(async (tx) => {
      await tx.purchaseOrderItem.deleteMany({ where: { orderId: id } });

      await tx.purchaseOrder.update({
        where: { id },
        data: {
          totalItems: lines.length,
          estimatedTotal,
          notes: notes || null,
          items: {
            create: lines.map((line) => ({
              productId: line.productId,
              quantity: line.quantity,
              unitCost: line.unitCost,
              lineTotal: line.lineTotal,
            })),
          },
        },
      });
    });

    revalidateOrders();
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "অর্ডার আপডেট করা সম্ভব হয়নি।") };
  }
}

// ==========================================
// 4. DELETE / CANCEL PURCHASE ORDER
// ==========================================
export async function deletePurchaseOrderAction(orderId: string) {
  try {
    const user = await requireAuth({
      requiredPermission: PERMISSIONS.PURCHASES_MANAGE,
      requireActiveStatus: true,
    });

    const po = await prisma.purchaseOrder.findFirst({
      where: { id: orderId, shopId: user.shopId, branchId: user.activeBranchId },
    });

    if (!po) return { success: false, error: "অর্ডার পাওয়া যায়নি।" };
    if (po.status === "CONVERTED") {
      return { success: false, error: "চালানে রূপান্তরিত অর্ডার মোছা সম্ভব নয়।" };
    }

    await prisma.purchaseOrder.delete({ where: { id: orderId } });

    revalidateOrders();
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "অর্ডার মুছে ফেলা সম্ভব হয়নি।") };
  }
}
