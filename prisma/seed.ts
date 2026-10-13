import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

const DEFAULT_UNITS = [
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

async function main() {
  console.log("🌱 Starting complete grocery store seed...");

  // 1. Create or Find Demo Shop
  let shop = await prisma.shop.findFirst({
    where: { phone: "01700000000" },
  });

  if (!shop) {
    shop = await prisma.shop.create({
      data: {
        name: "মেসার্স মদিনা জেনারেল স্টোর",
        nameEn: "Madina General Store",
        phone: "01700000000",
        currencySymbol: "৳",
        address: "দোকান নং ১২, কাওরান বাজার, ঢাকা",
      },
    });
    console.log("✅ Created Shop:", shop.name);
  }

  // 2. Create or Find Main Branch
  let mainBranch = await prisma.branch.findFirst({
    where: { shopId: shop.id, isMain: true },
  });

  if (!mainBranch) {
    mainBranch = await prisma.branch.create({
      data: {
        name: "Main Branch",
        code: "MAIN",
        phone: shop.phone,
        address: shop.address,
        isMain: true,
        status: "active",
        shopId: shop.id,
      },
    });
    console.log("✅ Created Main Branch:", mainBranch.name);
  }

  // 3. Create Demo Owner linked to Main Branch
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
        branchId: mainBranch.id,
        isActive: true,
      },
    });
    console.log("✅ Created Owner: owner@grocery.com (Password: 123456)");
  }

  // 4. Seed Standard Measurement Units
  console.log("Seeding measurement units...");
  for (const u of DEFAULT_UNITS) {
    await prisma.unit.upsert({
      where: {
        shopId_shortCode: { shopId: shop.id, shortCode: u.shortCode },
      },
      update: {},
      create: {
        name: u.name,
        shortCode: u.shortCode,
        allowDecimal: u.allowDecimal,
        shopId: shop.id,
      },
    });
  }

  // Fetch unit map for linking products
  const unitMap = new Map();
  const allUnits = await prisma.unit.findMany({ where: { shopId: shop.id } });
  allUnits.forEach((u) => unitMap.set(u.shortCode, u.id));

  // 5. Seed Product Categories
  console.log("Seeding categories...");
  const categoriesData = [
    { name: "ডেইরি ও তরল দুধ", slug: "dairy-milk", description: "তরল দুধ, মাখন, ঘি ও পনির" },
    { name: "পানীয় ও জুস", slug: "beverages", description: "কোল্ড ড্রিংকস, মিনারেল ওয়াটার ও ফলের জুস" },
    { name: "চাল, ডাল ও আটা", slug: "rice-grains", description: "মিনিকেট চাল, মসুর ডাল, খোলা আটা" },
    { name: "স্ন্যাকস ও বিস্কুট", slug: "snacks-biscuits", description: "চিপস, কুকিজ ও কনফেকশনারি" },
    { name: "রান্নার তেল ও মশলা", slug: "cooking-essentials", description: "সয়াবিন তেল, হলুদ, মরিচ গুঁড়া" },
    { name: "প্রসাধন ও টয়লেট্রিজ", slug: "personal-care", description: "সাবান, শ্যাম্পু ও টুথপেস্ট" },
  ];

  const categoryMap = new Map();
  for (const cat of categoriesData) {
    const createdCat = await prisma.category.upsert({
      where: { shopId_slug: { shopId: shop.id, slug: cat.slug } },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        status: "active",
        shopId: shop.id,
      },
    });
    categoryMap.set(cat.slug, createdCat.id);
  }

  // 6. Seed Brands / Distributor Companies
  console.log("Seeding brands...");
  const brandsData = [
    { name: "Pran Foods", companyName: "প্রাণ-আরএফএল গ্রুপ", contactPerson: "মোঃ রফিকুল ইসলাম (SR)", phone: "01711223344" },
    { name: "Unilever", companyName: "ইউনিলিভার বাংলাদেশ লিঃ", contactPerson: "তানভীর হাসান (SR)", phone: "01822334455" },
    { name: "Square", companyName: "স্কয়ার কনজিউমার প্রডাক্টস", contactPerson: "কামরুল ইসলাম (SR)", phone: "01933445566" },
    { name: "Nestlé", companyName: "নেসলে বাংলাদেশ", contactPerson: "ফারুক আহমেদ (SR)", phone: "01644556677" },
    { name: "Akij Food", companyName: "আকিজ ফুড অ্যান্ড বেভারেজ", contactPerson: "শাকিল চৌধুরী (SR)", phone: "01555667788" },
  ];

  const brandMap = new Map();
  for (const b of brandsData) {
    let brand = await prisma.brand.findFirst({
      where: { shopId: shop.id, name: b.name },
    });
    if (!brand) {
      brand = await prisma.brand.create({
        data: {
          name: b.name,
          companyName: b.companyName,
          contactPerson: b.contactPerson,
          phone: b.phone,
          status: "active",
          shopId: shop.id,
        },
      });
    }
    brandMap.set(b.name, brand.id);
  }

  // 7. Seed Store Sections (তাক ও র্যাক / Shelves & Racks)
  console.log("Seeding shelves and sections...");
  const sectionsData = [
    { name: "তাক নং ০১ (সামনের ডিসপ্লে)", code: "SH-01", description: "দোকানের সামনের প্রধান ডিসপ্লে তাক" },
    { name: "র্যাক-এ (কুলার ফ্রিজ)", code: "RK-A", description: "কোমল পানীয় ও দুগ্ধজাত ফ্রিজ র্যাক" },
    { name: "তাক নং ০২ (স্ন্যাকস তাক)", code: "SH-02", description: "বিস্কুট, চিপস ও চকলেটের তাক" },
    { name: "স্টোরেজ র্যাক (চাল-ডাল কর্নার)", code: "ST-01", description: "ভারী চালের বস্তা ও ডালের ফ্লোর র্যাক" },
    { name: "কসমেটিক্স তাক", code: "CS-01", description: "সাবান ও শ্যাম্পুর ক্যাবিনেট" },
  ];

  const sectionMap = new Map();
  for (const s of sectionsData) {
    let section = await prisma.productSection.findFirst({
      where: { shopId: shop.id, name: s.name },
    });
    if (!section) {
      section = await prisma.productSection.create({
        data: {
          name: s.name,
          code: s.code,
          description: s.description,
          status: "active",
          shopId: shop.id,
        },
      });
    }
    sectionMap.set(s.code, section.id);
  }

  // 8. Seed 10 Realistic Products with Stock
  console.log("Seeding products with stock...");
  const productsData = [
    {
      name: "আড়ং তরল দুধ ১ লিটার",
      nameEn: "Aarong Liquid Milk 1L",
      barcode: "890100100101",
      sku: "MILK-001",
      purchasePrice: 80,
      sellingPrice: 90,
      wholesalePrice: 85,
      vatPercent: 0,
      expiryDaysAhead: 15, // Expiring soon!
      alertQuantity: 10,
      initialStock: 35,
      unitCode: "ltr",
      catSlug: "dairy-milk",
      brandName: "Pran Foods",
      sectionCode: "RK-A",
      bulkUnitName: "Carton",
      conversionFactor: 12,
    },
    {
      name: "কোকাকোলা ৫০০ মিলি",
      nameEn: "Coca-Cola 500ml Pet",
      barcode: "890100100102",
      sku: "BEV-001",
      purchasePrice: 32,
      sellingPrice: 40,
      wholesalePrice: 36,
      vatPercent: 5,
      expiryDaysAhead: 180,
      alertQuantity: 15,
      initialStock: 72,
      unitCode: "pcs",
      catSlug: "beverages",
      brandName: "Akij Food",
      sectionCode: "RK-A",
      bulkUnitName: "Case",
      conversionFactor: 24,
    },
    {
      name: "প্রাণ ফ্রুটো ম্যাঙ্গো জুস ২৫০ মিলি",
      nameEn: "Pran Frooto Mango 250ml",
      barcode: "890100100103",
      sku: "BEV-002",
      purchasePrice: 22,
      sellingPrice: 30,
      wholesalePrice: 26,
      vatPercent: 0,
      expiryDaysAhead: 90,
      alertQuantity: 12,
      initialStock: 48,
      unitCode: "pcs",
      catSlug: "beverages",
      brandName: "Pran Foods",
      sectionCode: "RK-A",
      bulkUnitName: "Carton",
      conversionFactor: 24,
    },
    {
      name: "মিনিকেট চাল প্রিমিয়াম ৫০ কেজি বস্তা",
      nameEn: "Miniket Rice Premium 50kg Sack",
      barcode: "890100100104",
      sku: "RICE-001",
      purchasePrice: 3300,
      sellingPrice: 3550,
      wholesalePrice: 3450,
      vatPercent: 0,
      expiryDaysAhead: 365,
      alertQuantity: 5,
      initialStock: 20,
      unitCode: "bag",
      catSlug: "rice-grains",
      brandName: "Square",
      sectionCode: "ST-01",
      bulkUnitName: "Truckload",
      conversionFactor: 100,
    },
    {
      name: "তীর সয়াবিন তেল ৫ লিটার বোতল",
      nameEn: "Teer Fortified Soybean Oil 5L",
      barcode: "890100100105",
      sku: "OIL-001",
      purchasePrice: 890,
      sellingPrice: 960,
      wholesalePrice: 920,
      vatPercent: 0,
      expiryDaysAhead: 270,
      alertQuantity: 8,
      initialStock: 16,
      unitCode: "ltr",
      catSlug: "cooking-essentials",
      brandName: "Square",
      sectionCode: "SH-01",
      bulkUnitName: "Carton",
      conversionFactor: 4,
    },
    {
      name: "রাধুনী খাঁটি হলুদ গুঁড়া ২০০ গ্রাম",
      nameEn: "Radhuni Turmeric Powder 200g",
      barcode: "890100100106",
      sku: "SPICE-001",
      purchasePrice: 65,
      sellingPrice: 75,
      wholesalePrice: 70,
      vatPercent: 0,
      expiryDaysAhead: 300,
      alertQuantity: 10,
      initialStock: 40,
      unitCode: "pkt",
      catSlug: "cooking-essentials",
      brandName: "Square",
      sectionCode: "SH-01",
      bulkUnitName: "Box",
      conversionFactor: 24,
    },
    {
      name: "লাক্স সাবান ভেলভেট টাচ ১০০ গ্রাম",
      nameEn: "Lux Velvet Touch Soap 100g",
      barcode: "890100100107",
      sku: "SOAP-001",
      purchasePrice: 56,
      sellingPrice: 65,
      wholesalePrice: 60,
      vatPercent: 7.5,
      expiryDaysAhead: 500,
      alertQuantity: 12,
      initialStock: 60,
      unitCode: "pcs",
      catSlug: "personal-care",
      brandName: "Unilever",
      sectionCode: "CS-01",
      bulkUnitName: "Pack",
      conversionFactor: 12,
    },
    {
      name: "ওরিয়ো চকলেট বিস্কুট ১২০ গ্রাম",
      nameEn: "Oreo Chocolate Cream Biscuit 120g",
      barcode: "890100100108",
      sku: "SNACK-001",
      purchasePrice: 40,
      sellingPrice: 50,
      wholesalePrice: 45,
      vatPercent: 0,
      expiryDaysAhead: 120,
      alertQuantity: 15,
      initialStock: 3, // 👈 LOW STOCK WARNING DEMO!
      unitCode: "pkt",
      catSlug: "snacks-biscuits",
      brandName: "Nestlé",
      sectionCode: "SH-02",
      bulkUnitName: "Carton",
      conversionFactor: 24,
    },
    {
      name: "ফ্রেশ রিফাইন্ড সাদা চিনি ১ কেজি",
      nameEn: "Fresh Refined White Sugar 1kg",
      barcode: "890100100109",
      sku: "SUGAR-001",
      purchasePrice: 125,
      sellingPrice: 135,
      wholesalePrice: 130,
      vatPercent: 0,
      expiryDaysAhead: 400,
      alertQuantity: 20,
      initialStock: 85,
      unitCode: "kg",
      catSlug: "cooking-essentials",
      brandName: "Pran Foods",
      sectionCode: "SH-01",
      bulkUnitName: "Sack",
      conversionFactor: 50,
    },
    {
      name: "ম্যাগি ২-মিনিট নুডলস ৮ প্যাক",
      nameEn: "Maggi 2-Minute Noodles 8-Pack",
      barcode: "890100100110",
      sku: "NOOD-001",
      purchasePrice: 140,
      sellingPrice: 165,
      wholesalePrice: 150,
      vatPercent: 0,
      expiryDaysAhead: 150,
      alertQuantity: 10,
      initialStock: 25,
      unitCode: "pkt",
      catSlug: "snacks-biscuits",
      brandName: "Nestlé",
      sectionCode: "SH-02",
      bulkUnitName: "Carton",
      conversionFactor: 16,
    },
  ];

  for (const p of productsData) {
    const unitId = unitMap.get(p.unitCode);
    const categoryId = categoryMap.get(p.catSlug);
    const brandId = brandMap.get(p.brandName);
    const sectionId = sectionMap.get(p.sectionCode);

    if (!unitId || !categoryId) continue;

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + p.expiryDaysAhead);

    // Upsert Product record
    const product = await prisma.product.upsert({
      where: {
        shopId_barcode: { shopId: shop.id, barcode: p.barcode },
      },
      update: {
        purchasePrice: p.purchasePrice,
        sellingPrice: p.sellingPrice,
        wholesalePrice: p.wholesalePrice,
        vatPercent: p.vatPercent,
        expiryDate,
        alertQuantity: p.alertQuantity,
        bulkUnitName: p.bulkUnitName,
        conversionFactor: p.conversionFactor,
      },
      create: {
        name: p.name,
        nameEn: p.nameEn,
        barcode: p.barcode,
        sku: p.sku,
        description: `নিয়মিত খুচরা ও পাইকারি বিক্রয়ের পণ্য। ${p.nameEn}`,
        purchasePrice: p.purchasePrice,
        sellingPrice: p.sellingPrice,
        wholesalePrice: p.wholesalePrice,
        vatPercent: p.vatPercent,
        expiryDate,
        alertQuantity: p.alertQuantity,
        bulkUnitName: p.bulkUnitName,
        conversionFactor: p.conversionFactor,
        status: "active",
        unitId,
        categoryId,
        brandId,
        sectionId,
        shopId: shop.id,
      },
    });

    // Seed branch stock in ProductStock table
    await prisma.productStock.upsert({
      where: {
        productId_branchId: {
          productId: product.id,
          branchId: mainBranch.id,
        },
      },
      update: {
        quantity: p.initialStock,
      },
      create: {
        productId: product.id,
        branchId: mainBranch.id,
        quantity: p.initialStock,
      },
    });
  }

  console.log("✅ Seeded 10 products with branch stock successfully!");
  console.log("🎉 Complete seed finished successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });