// app/dashboard/admin/purchases/[id]/edit/page.tsx

import { notFound } from "next/navigation"; // 👈 FIX: Import notFound
import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import { prisma } from "@/lib/prisma";
import { getSuppliers } from "@/queries/supplier-queries";
import { getProducts } from "@/queries/product-queries";
import PurchaseForm from "../../_components/form/PurchaseForm";

export default async function EditPurchasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // 1. Zero-Trust Guard: Enforce permissions and active status
  const user = await requireAuth({
    requiredPermission: PERMISSIONS.CATALOG_MANAGE,
    requireActiveStatus: true,
  });

  const { id } = await params;
  const { shopId, activeBranchId } = user;

  // 2. Fetch purchase record and dependencies in parallel
  const [rawPurchase, products, suppliers, activeBranch, shop] = await Promise.all([
    prisma.purchase.findFirst({
      where: { id, shopId },
      include: {
        items: {
          include: {
            product: {
              include: {
                unit: true,
                stocks: { where: { branchId: activeBranchId } },
              },
            },
          },
        },
        supplier: true,
        branch: { select: { name: true } },
      },
    }),
    getProducts(shopId, activeBranchId),
    getSuppliers(shopId, activeBranchId),
    prisma.branch.findUnique({
      where: { id: activeBranchId },
      select: { name: true },
    }),
    prisma.shop.findUnique({
      where: { id: shopId },
      select: { currencySymbol: true },
    }),
  ]);

  // 3. 404 Guard: If chalan doesn't exist, trigger Next.js notFound boundary
  if (!rawPurchase) {
    return notFound(); // 👈 FIX: return notFound() guarantees type narrowing!
  }

  // 4. Safely map Decimal & Date instances for the Client Component
  const purchase = {
    id: rawPurchase.id,
    chalanNo: rawPurchase.chalanNo,
    paymentMethod: rawPurchase.paymentMethod,
    paymentStatus: rawPurchase.paymentStatus,
    notes: rawPurchase.notes || "",
    supplierId: rawPurchase.supplierId,
    branchId: rawPurchase.branchId,
    purchaseDate: rawPurchase.purchaseDate ? rawPurchase.purchaseDate.toISOString() : null,
    subtotal: Number(rawPurchase.subtotal),
    totalQuantity: Number(rawPurchase.totalQuantity),
    discount: Number(rawPurchase.discount),
    transportCost: Number(rawPurchase.transportCost),
    vatPercent: Number(rawPurchase.vatPercent),
    vatAmount: Number(rawPurchase.vatAmount),
    grandTotal: Number(rawPurchase.grandTotal),
    previousDue: Number(rawPurchase.previousDue),
    paidAmount: Number(rawPurchase.paidAmount),
    dueAmount: Number(rawPurchase.dueAmount),
    items: rawPurchase.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product?.name || "পণ্য",
      barcode: item.product?.barcode || "",
      unitCode: item.product?.unit?.shortCode || "pcs",
      stock: Number(item.product?.stocks?.[0]?.quantity || 0),
      quantity: Number(item.quantity),
      unitCost: Number(item.unitCost),
      commission: Number(item.commission || 0),
      lineTotal: Number(item.lineTotal),
    })),
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PurchaseForm
        mode="edit"
        initialData={purchase}
        products={products as any}
        suppliers={suppliers as any}
        activeBranchName={rawPurchase.branch?.name || activeBranch?.name || "Main Branch"}
        currencySymbol={shop?.currencySymbol || "৳"}
      />
    </div>
  );
}