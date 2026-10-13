"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";

export async function registerStoreAction(formData: FormData) {
  try {
    // 1. Zod Validation
    const validated = registerSchema.safeParse({
      shopName: formData.get("shopName")?.toString().trim(),
      phone: formData.get("phone")?.toString().trim(),
      currency: formData.get("currency")?.toString().trim() || "BDT",
      currencySymbol: formData.get("currencySymbol")?.toString().trim() || "৳",
      village: formData.get("village")?.toString().trim() || null,
      district: formData.get("district")?.toString().trim() || null,
      ownerName: formData.get("ownerName")?.toString().trim(),
      email: formData.get("email")?.toString().toLowerCase().trim(),
      password: formData.get("password")?.toString(),
    });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const data = validated.data;

    // 2. Check if email exists
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return { success: false, error: "An account with this email already exists." };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const storeAddress = [data.village, data.district].filter(Boolean).join(", ") || null;

    // 3. Single Atomic Transaction: Shop + Main Branch + Owner + 10 Default Units
    await prisma.$transaction(async (tx) => {
      // Create Shop
      const shop = await tx.shop.create({
        data: {
          name: data.shopName,
          phone: data.phone,
          currencySymbol: data.currencySymbol,
          address: storeAddress,
        },
      });

      // 👈 Auto-create default Main Branch
      const mainBranch = await tx.branch.create({
        data: {
          name: "Main Branch",
          code: "MAIN",
          phone: data.phone,
          address: storeAddress,
          isMain: true,
          status: "active",
          shopId: shop.id,
        },
      });

      // Create Store Owner linked to the Main Branch
      await tx.user.create({
        data: {
          name: data.ownerName,
          email: data.email,
          password: hashedPassword,
          phone: data.phone,
          role: "OWNER",
          shopId: shop.id,
          branchId: mainBranch.id, // 👈 Linked to Branch
          isActive: true,
        },
      });

      // Seed 10 Default Grocery Units
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
        await tx.unit.create({
          data: {
            name: u.name,
            shortCode: u.shortCode,
            allowDecimal: u.allowDecimal,
            shopId: shop.id,
          },
        });
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Store registration failed:", error);
    return { success: false, error: error.message || "Failed to register store." };
  }
}