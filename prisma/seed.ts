import { prisma } from "../lib/prisma";

async function main() {
  console.log("🌱 Starting database seed...");

  // Create a default demo shop if none exists
  const existingShop = await prisma.shop.findFirst({
    where: { phone: "01700000000" },
  });

  if (!existingShop) {
    const shop = await prisma.shop.create({
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
    console.log("ℹ️ Demo shop already exists:", existingShop.name);
  }

  console.log("🎉 Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });