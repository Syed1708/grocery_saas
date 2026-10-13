"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function registerStoreAction(formData: FormData) {
  try {
    const shopName = formData.get("shopName")?.toString().trim();
    const phone = formData.get("phone")?.toString().trim();
    const currency = formData.get("currency")?.toString().trim() || "USD";
    const currencySymbol =
      formData.get("currencySymbol")?.toString().trim() || "$";
    const village = formData.get("village")?.toString().trim() || "";
    const district = formData.get("district")?.toString().trim() || "";

    const ownerName = formData.get("ownerName")?.toString().trim();
    const email = formData.get("email")?.toString().toLowerCase().trim();
    const password = formData.get("password")?.toString();

    if (!shopName || !phone || !ownerName || !email || !password) {
      return { success: false, error: "Please fill in all required fields." };
    }

    if (password.length < 6) {
      return {
        success: false,
        error: "Password must be at least 6 characters.",
      };
    }

    // Check if email already exists in MySQL
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return {
        success: false,
        error: "An account with this email already exists.",
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Inside registerStoreAction, inside the prisma.$transaction block:
    await prisma.$transaction(async (tx) => {
      const shop = await tx.shop.create({
        data: {
          name: shopName,
          phone,
          currency,
          currencySymbol,
          village: village || null,
          district: district || null,
        },
      });

      await tx.user.create({
        data: {
          name: ownerName,
          email,
          password: hashedPassword,
          phone,
          role: "OWNER",
          shopId: shop.id,
          isActive: true,
        },
      });

      // 👈 Automatically seed the 10 units for this brand-new store:
      const defaultUnits = [
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

      await tx.unit.createMany({
        data: defaultUnits.map((u) => ({
          name: u.name,
          code: u.code,
          shopId: shop.id,
        })),
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error("Store registration failed:", error);
    return {
      success: false,
      error: error.message || "Failed to register store.",
    };
  }
}
