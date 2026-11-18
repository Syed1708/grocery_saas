"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { unitSchema } from "@/lib/validations";
import { requireAuth } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/types/rbac";
import { getErrorMessage } from "@/lib/utils";

const UNIT_REVALIDATE_PATHS = ["/dashboard/admin/products"];

function revalidateUnitPaths() {
  for (const path of UNIT_REVALIDATE_PATHS) revalidatePath(path);
}

/** Map a unit form to the shape `unitSchema` expects. */
function formToUnitInput(formData: FormData) {
  return {
    name: formData.get("name")?.toString().trim(),
    code: formData.get("code")?.toString().toLowerCase().trim(),
  };
}

async function getUnitManager() {
  // 🛡️ Zero-Trust Guard: Enforce catalog management permission
  return requireAuth({
    requiredPermission: PERMISSIONS.CATALOG_MANAGE,
    requireActiveStatus: true,
  });
}

export async function createUnitAction(formData: FormData) {
  try {
    const user = await getUnitManager();

    const parsed = unitSchema.safeParse(formToUnitInput(formData));
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { name, code } = parsed.data;

    const existing = await prisma.unit.findUnique({
      where: { shopId_shortCode: { shopId: user.shopId, shortCode: code } },
    });
    if (existing) {
      return { success: false, error: `Unit code "${code}" already exists.` };
    }

    await prisma.unit.create({
      data: {
        name,
        shortCode: code,
        shopId: user.shopId,
      },
    });

    revalidateUnitPaths();
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Failed to create unit.") };
  }
}

export async function seedDefaultUnitsAction() {
  try {
    const user = await getUnitManager();

    const defaultUnits = [
      { name: "Piece", shortCode: "pcs", allowDecimal: false },
      { name: "Kilogram", shortCode: "kg", allowDecimal: true },
      { name: "Gram", shortCode: "gm", allowDecimal: true },
      { name: "Packet", shortCode: "pkt", allowDecimal: false },
      { name: "Liter", shortCode: "ltr", allowDecimal: true },
      { name: "Milliliter", shortCode: "ml", allowDecimal: true },
      { name: "Dozen", shortCode: "dzn", allowDecimal: false },
      { name: "Carton", shortCode: "ctn", allowDecimal: false },
      { name: "Box", shortCode: "box", allowDecimal: false },
      { name: "Bag", shortCode: "bag", allowDecimal: true },
    ];

    for (const u of defaultUnits) {
      await prisma.unit.upsert({
        where: { shopId_shortCode: { shopId: user.shopId, shortCode: u.shortCode } },
        update: {},
        create: {
          name: u.name,
          shortCode: u.shortCode,
          allowDecimal: u.allowDecimal,
          shopId: user.shopId,
        },
      });
    }

    revalidateUnitPaths();
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Failed to load default units.") };
  }
}

export async function deleteUnitAction(id: string) {
  try {
    const user = await getUnitManager();

    const productCount = await prisma.product.count({
      where: { unitId: id, shopId: user.shopId },
    });

    if (productCount > 0) {
      return {
        success: false,
        error: `Cannot delete unit: It is used by ${productCount} product(s).`,
      };
    }

    await prisma.unit.delete({ where: { id } });

    revalidateUnitPaths();
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Failed to delete unit.") };
  }
}
