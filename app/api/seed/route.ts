import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/services/dbConnect";
import { Shop } from "@/models/Shop";
import { User } from "@/models/User";

export async function GET() {
  try {
    await dbConnect();

    // Check if demo shop already exists
    let shop = await Shop.findOne({ phone: "01700000000" });
    if (!shop) {
      shop = await Shop.create({
        name: "Fresh Valley Grocery",
        phone: "01700000000",
        currency: "USD",
        currencySymbol: "$",
        village: "Greenville",
        district: "Dhaka",
        addressLine: "Station Road Market",
      });
    }

    // Check if demo owner already exists
    let owner = await User.findOne({ email: "owner@grocery.com" });
    if (!owner) {
      const hashedPassword = await bcrypt.hash("123456", 10);
      owner = await User.create({
        name: "Store Owner",
        email: "owner@grocery.com",
        password: hashedPassword,
        phone: "01700000000",
        role: "OWNER",
        shopId: shop._id,
        isActive: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Seed data created successfully!",
      credentials: {
        email: "owner@grocery.com",
        password: "123456",
        shopName: shop.name,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}