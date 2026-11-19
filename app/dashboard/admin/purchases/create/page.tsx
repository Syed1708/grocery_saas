import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types";
import { prisma } from "@/lib/prisma";
import { getSuppliers } from "@/queries/supplier-queries";
import { getProducts } from "@/queries/product-queries";
import PurchaseForm from "../_components/form/PurchaseForm";
import type { IPurchaseFormInitialData } from "@/types/purchase";

interface PageProps {
  // 🛡️ Next.js 16 App Router async Promise
  searchParams: Promise<{ fromPO?: string }>;
}

function generateChalanNo() {
  return `CHAL-${Date.now().toString().slice(-6)}`;
}

export default async function CreatePurchasePage(props: PageProps) {
  // 1. Await searchParams
  const searchParams = await props.searchParams;
  const fromPO = searchParams?.fromPO;

  // 2. 🛡️ Zero-Trust Guard
  const user = await requireAuth({
    requiredPermission: PERMISSIONS.PURCHASES_MANAGE,
    requireActiveStatus: true,
  });

  const { shopId, activeBranchId } = user;

  // 3. Parallel queries (PO check, Products, Suppliers, Branch, Shop)
  const [po, products, suppliers, activeBranch, shop] = await Promise.all([
    fromPO
      ? prisma.purchaseOrder.findFirst({
          where: { id: fromPO, shopId },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    barcode: true,
                    unit: { select: { shortCode: true } },
                  },
                },
              },
            },
          },
        })
      : null,
    getProducts(shopId, activeBranchId),
    getSuppliers(shopId, activeBranchId),
    prisma.branch.findUnique({
      where: { id: activeBranchId! },
      select: { name: true, code: true },
    }),
    prisma.shop.findUnique({
      where: { id: shopId },
      select: { currencySymbol: true, name: true },
    }),
  ]);

  // 4. Format PO items if converted
  let poInitialData: IPurchaseFormInitialData | null = null;
  if (po) {
    poInitialData = {
      fromPOId: po.id,
      supplierId: po.supplierId,
      items: po.items.map((i) => ({
        productId: i.productId,
        name: i.product.name,
        barcode: i.product.barcode,
        unit: i.product.unit?.shortCode || "pcs",
        quantity: Number(i.quantity),
        billedQuantity: Number(i.quantity),
        damagedQuantity: 0,
        missingQuantity: 0,
        unitCost: Number(i.unitCost),
        commission: 0,
      })),
    };
  }

  const autoChalan = generateChalanNo();

  return (
    <div className="max-w-7xl mx-auto">
      <PurchaseForm
        mode="create"
        initialData={poInitialData ?? undefined} // 👈 ADDED: Pre-fills form when converted from PO!
        products={products}
        suppliers={suppliers}
        activeBranchName={activeBranch?.name || "Main Branch"}
        currencySymbol={shop?.currencySymbol || "৳"}
        autoChalan={autoChalan}
      />
    </div>
  );
}