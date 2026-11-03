// app/dashboard/admin/purchases/[id]/edit/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSuppliers } from "@/queries/supplier-queries";
import { getProducts } from "@/queries/product-queries";
import EditPurchaseClient from "./_components/EditPurchaseClient";

export default async function EditPurchasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.shopId) {
    redirect("/login");
  }

  const { id } = await params;
  const { shopId, branchId } = session.user;

  // 1. Fetch data from Prisma
  const [rawPurchase, products, suppliers, activeBranch, shop] = await Promise.all([
    prisma.purchase.findFirst({
      where: { id, shopId },
      include: {
        items: {
          include: {
            product: {
              include: {
                unit: true,
                stocks: branchId ? { where: { branchId } } : true,
              },
            },
          },
        },
        supplier: true,
      },
    }),
    getProducts(shopId, branchId),
    getSuppliers(shopId),
    branchId
      ? prisma.branch.findUnique({ where: { id: branchId }, select: { name: true } })
      : prisma.branch.findFirst({ where: { shopId, isMain: true }, select: { name: true } }),
    prisma.shop.findUnique({
      where: { id: shopId },
      select: { currencySymbol: true },
    }),
  ]);

  if (!rawPurchase) {
    notFound();
  }

  // 2. 👈 Convert all Prisma Decimal & Date instances into plain JS numbers/strings
  const purchase = {
    id: rawPurchase.id,
    chalanNo: rawPurchase.chalanNo,
    paymentMethod: rawPurchase.paymentMethod,
    paymentStatus: rawPurchase.paymentStatus,
    notes: rawPurchase.notes || "",
    supplierId: rawPurchase.supplierId,
    branchId: rawPurchase.branchId,
    shopId: rawPurchase.shopId,
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
    createdAt: rawPurchase.createdAt.toISOString(),
    updatedAt: rawPurchase.updatedAt.toISOString(),
    supplier: rawPurchase.supplier
      ? {
          id: rawPurchase.supplier.id,
          name: rawPurchase.supplier.name,
          companyName: rawPurchase.supplier.companyName,
          phone: rawPurchase.supplier.phone,
          currentDue: Number(rawPurchase.supplier.currentDue),
          payableBalance: Number(rawPurchase.supplier.currentDue),
        }
      : null,
    items: rawPurchase.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: Number(item.quantity),
      unitCost: Number(item.unitCost),
      commission: Number(item.commission),
      lineTotal: Number(item.lineTotal),
      product: item.product
        ? {
            id: item.product.id,
            name: item.product.name,
            barcode: item.product.barcode,
            purchasePrice: Number(item.product.purchasePrice),
            sellingPrice: Number(item.product.sellingPrice),
            unit: item.product.unit ? { shortCode: item.product.unit.shortCode } : null,
            stocks: (item.product.stocks || []).map((st) => ({
              quantity: Number(st.quantity),
            })),
          }
        : null,
    })),
  };

  return (
    <div className="max-w-7xl mx-auto">
      <EditPurchaseClient
        purchase={purchase}
        products={products as any}
        suppliers={suppliers as any}
        activeBranchName={activeBranch?.name || "Main Branch"}
        currencySymbol={shop?.currencySymbol || "৳"}
      />
    </div>
  );
}