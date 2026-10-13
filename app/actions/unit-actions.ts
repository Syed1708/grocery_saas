"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authOptions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { unitSchema } from "@/lib/validations";


const DEFAULT_UNITS = [
  { name: "Piece", code: "pcs" },
  { name: "Kilogram", code: "kg" },
  { name: "Gram", code: "gm" },
  { name: "Packet", code: "pkt" },
  { name: "Liter", code: "ltr" },
  { name: "Milliliter", code: "ml" },
  { name: "Dozen", code: "dzn" },
  { name: "Carton", code: "ctn" },
  { name: "Box", code: "box" },
  { name: "Bag", code: "bag" },
];

export async function seedDefaultUnitsAction() {
  try {
    const user = await getAuthenticatedUser();

    for (const u of DEFAULT_UNITS) {
      await prisma.unit.upsert({
        where: {
          shopId_code: { shopId: user.shopId, code: u.code },
        },
        update: {},
        create: {
          name: u.name,
          code: u.code,
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

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.shopId) {
    throw new Error("Unauthorized");
  }
  if (session.user.role !== "OWNER" && session.user.role !== "MANAGER") {
    throw new Error("Forbidden: Only Owners and Managers can manage units.");
  }
  return session.user;
}

export async function createUnitAction(formData: FormData) {
  try {
    const user = await getAuthenticatedUser();

    // Validate with Zod
    const validated = unitSchema.safeParse({
      name: formData.get("name")?.toString().trim(),
      code: formData.get("code")?.toString().toLowerCase().trim(),
    });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { name, code } = validated.data;

    const existing = await prisma.unit.findUnique({
      where: { shopId_code: { shopId: user.shopId, code } },
    });
    if (existing) {
      return { success: false, error: `Unit code "${code}" already exists.` };
    }

    await prisma.unit.create({
      data: {
        name,
        code,
        shopId: user.shopId,
      },
    });

    revalidatePath("/dashboard/admin/units");
    revalidatePath("/dashboard/admin/products");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create unit." };
  }
}

export async function deleteUnitAction(id: string) {
  try {
    const user = await getAuthenticatedUser();

    // Verify if unit is in use by any product
    const productCount = await prisma.product.count({
      where: { unitId: id, shopId: user.shopId },
    });

    if (productCount > 0) {
      return {
        success: false,
        error: `Cannot delete unit: It is currently used by ${productCount} product(s).`,
      };
    }

    await prisma.unit.delete({
      where: { id },
    });

    revalidatePath("/dashboard/admin/units");
    revalidatePath("/dashboard/admin/products");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete unit." };
  }
}