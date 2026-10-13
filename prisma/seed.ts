import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

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

async function main() {
  console.log("🌱 Starting complete database seed...");

  // 1. Create or Find Demo Shop
  let shop = await prisma.shop.findFirst({
    where: { phone: "01700000000" },
  });

  if (!shop) {
    shop = await prisma.shop.create({
      data: {
        name: "Fresh Valley Grocery",
        phone: "01700000000",
        currency: "USD",
        currencySymbol: "$",
        village: "Greenville",
        district: "Dhaka",
        addressLine: "Station Road Market",
      },
    });
    console.log("✅ Created demo shop:", shop.name);
  } else {
    console.log("ℹ️ Demo shop already exists:", shop.name);
  }

  // 2. Create or Find Demo Owner
  const existingOwner = await prisma.user.findUnique({
    where: { email: "owner@grocery.com" },
  });

  if (!existingOwner) {
    const hashedPassword = await bcrypt.hash("123456", 10);
    await prisma.user.create({
      data: {
        name: "Store Owner",
        email: "owner@grocery.com",
        password: hashedPassword,
        phone: "01700000000",
        role: "OWNER",
        shopId: shop.id,
        isActive: true,
      },
    });
    console.log("✅ Created demo owner: owner@grocery.com (pass: 123456)");
  } else {
    console.log("ℹ️ Demo owner already exists.");
  }

  // 3. Seed Default Units for this Shop
  console.log("Seeding grocery measurement units...");
  for (const u of DEFAULT_UNITS) {
    await prisma.unit.upsert({
      where: {
        shopId_code: { shopId: shop.id, code: u.code },
      },
      update: {},
      create: {
        name: u.name,
        code: u.code,
        shopId: shop.id,
      },
    });
  }
  console.log("✅ Seeded 10 default measurement units successfully!");
  console.log("🎉 All seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });