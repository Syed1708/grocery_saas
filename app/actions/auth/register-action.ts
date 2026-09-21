"use server";

import bcrypt from "bcryptjs";
import { dbConnect } from "@/services/dbConnect";
import { Shop } from "@/models/Shop";
import { User } from "@/models/User";

export async function registerStoreAction(formData: FormData) {
  try {
    await dbConnect();

    const shopName = formData.get("shopName")?.toString().trim();
    const phone = formData.get("phone")?.toString().trim();
    const currency = formData.get("currency")?.toString().trim() || "USD";
    const currencySymbol = formData.get("currencySymbol")?.toString().trim() || "$";
    const village = formData.get("village")?.toString().trim() || "";
    const district = formData.get("district")?.toString().trim() || "";

    const ownerName = formData.get("ownerName")?.toString().trim();
    const email = formData.get("email")?.toString().toLowerCase().trim();
    const password = formData.get("password")?.toString();

    // Validation
    if (!shopName || !phone || !ownerName || !email || !password) {
      return { success: false, error: "Please fill in all required fields." };
    }

    if (password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters long." };
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { success: false, error: "An account with this email already exists." };
    }

    // 1. Create the Shop
    const newShop = await Shop.create({
      name: shopName,
      phone,
      currency,
      currencySymbol,
      village,
      district,
    });

    // 2. Hash password & create the Owner User
    const hashedPassword = await bcrypt.hash(password, 10);
    const newOwner = await User.create({
      name: ownerName,
      email,
      password: hashedPassword,
      phone,
      role: "OWNER",
      shopId: newShop._id,
      isActive: true,
    });

    // 3. Link owner back to shop
    newShop.ownerId = newOwner._id;
    await newShop.save();

    return { success: true };
  } catch (error: any) {
    console.error("Registration error:", error);
    return { success: false, error: error.message || "Failed to register store." };
  }
}