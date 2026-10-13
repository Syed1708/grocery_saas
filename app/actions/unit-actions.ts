"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { unitSchema } from "@/lib/validations";

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.shopId) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function createUnitAction(formData: FormData) {
  try {
    const user = await getAuthenticatedUser();

    const validated = unitSchema.safeParse({
      name: formData.get("name")?.toString().trim(),
      code: formData.get("code")?.toString().toLowerCase().trim(),
    });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { name, code } = validated.data;

    // Check unique on shopId_shortCode
    const existing = await prisma.unit.findUnique({
      where: { shopId_shortCode: { shopId: user.shopId, shortCode: code } },
    });
    if (existing) {
      return { success: false, error: `Unit code "${code}" already exists.` };
    }

    await prisma.unit.create({
      data: {
        name,
        shortCode: code, // 👈 Saved as shortCode
        shopId: user.shopId,
      },
    });

    revalidatePath("/dashboard/admin/products");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create unit." };
  }
}

export async function seedDefaultUnitsAction() {
  try {
    const user = await getAuthenticatedUser();

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

    revalidatePath("/dashboard/admin/products");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to load default units." };
  }
}

export async function deleteUnitAction(id: string) {
  try {
    const user = await getAuthenticatedUser();

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

    revalidatePath("/dashboard/admin/products");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete unit." };
  }
}