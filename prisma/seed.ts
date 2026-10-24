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
  console.log("🌱 Starting master grocery store seed...");

  // ==========================================
  // 1. STORE & BRANCH SETUP
  // ==========================================
  console.log("🏪 Setting up Shop & Branch...");
  let shop = await prisma.shop.findFirst({
    where: { phone: "01700000000" },
  });

  if (!shop) {
    shop = await prisma.shop.create({
      data: {
        name: "মেসার্স মদিনা জেনারেল স্টোর",
        nameEn: "Madina General Store",
        phone: "01700000000",
        email: "contact@madinastore.com",
        currencySymbol: "৳",
        address: "দোকান নং ১২, কাওরান বাজার, ঢাকা-১২১৫",
        tradeLicense: "TRAD/DNCC/09124/2024",
        binVatNumber: "001294821-0101",
        enableVat: true,
        vatPercent: 5.0,
        thermalWidth: "80mm",
      },
    });
  }

  let mainBranch = await prisma.branch.findFirst({
    where: { shopId: shop.id, isMain: true },
  });

  if (!mainBranch) {
    mainBranch = await prisma.branch.create({
      data: {
        name: "Main Branch (কাওরান বাজার)",
        code: "MAIN",
        phone: shop.phone,
        address: shop.address,
        isMain: true,
        status: "active",
        shopId: shop.id,
      },
    });
  }

  // ==========================================
  // 2. USERS (OWNER, MANAGER, CASHIER)
  // ==========================================
  console.log("👥 Creating demo users for RBAC testing...");
  const hashedPassword = await bcrypt.hash("123456", 10);

  // 1. Owner
  let owner = await prisma.user.findUnique({ where: { email: "owner@grocery.com" } });
  if (!owner) {
    owner = await prisma.user.create({
      data: {
        name: "Haji Mohammad Selim (Owner)",
        email: "owner@grocery.com",
        password: hashedPassword,
        phone: "01700000000",
        role: "OWNER",
        shopId: shop.id,
        branchId: mainBranch.id,
        isActive: true,
      },
    });
  }

  // 2. Manager
  let manager = await prisma.user.findUnique({ where: { email: "manager@grocery.com" } });
  if (!manager) {
    manager = await prisma.user.create({
      data: {
        name: "Kazi Faruk (Manager)",
        email: "manager@grocery.com",
        password: hashedPassword,
        phone: "01800000000",
        role: "MANAGER",
        shopId: shop.id,
        branchId: mainBranch.id,
        isActive: true,
      },
    });
  }

  // 3. Cashier
  let cashier = await prisma.user.findUnique({ where: { email: "cashier@grocery.com" } });
  if (!cashier) {
    cashier = await prisma.user.create({
      data: {
        name: "Rafiqul Islam (Cashier)",
        email: "cashier@grocery.com",
        password: hashedPassword,
        phone: "01900000000",
        role: "CASHIER",
        shopId: shop.id,
        branchId: mainBranch.id,
        isActive: true,
      },
    });
  }

  // ==========================================
  // 3. CATALOG (UNITS, SECTIONS, CATS, BRANDS)
  // ==========================================
  console.log("📦 Seeding measurement units...");
  for (const u of DEFAULT_UNITS) {
    await prisma.unit.upsert({
      where: { shopId_shortCode: { shopId: shop.id, shortCode: u.shortCode } },
      update: {},
      create: { name: u.name, shortCode: u.shortCode, allowDecimal: u.allowDecimal, shopId: shop.id },
    });
  }

  const unitMap = new Map();
  const allUnits = await prisma.unit.findMany({ where: { shopId: shop.id } });
  allUnits.forEach((u) => unitMap.set(u.shortCode, u.id));

  console.log("🗂️ Seeding categories...");
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
      create: { name: cat.name, slug: cat.slug, description: cat.description, status: "active", shopId: shop.id },
    });
    categoryMap.set(cat.slug, createdCat.id);
  }

  console.log("🏷️ Seeding brands...");
  const brandsData = [
    { name: "Pran Foods", companyName: "প্রাণ-আরএফএল গ্রুপ", contactPerson: "মোঃ রফিকুল ইসলাম (SR)", phone: "01711223344" },
    { name: "Unilever", companyName: "ইউনিলিভার বাংলাদেশ লিঃ", contactPerson: "তানভীর হাসান (SR)", phone: "01822334455" },
    { name: "Square", companyName: "স্কয়ার কনজিউমার প্রডাক্টস", contactPerson: "কামরুল ইসলাম (SR)", phone: "01933445566" },
    { name: "Nestlé", companyName: "নেসলে বাংলাদেশ", contactPerson: "ফারুক আহমেদ (SR)", phone: "01644556677" },
    { name: "Akij Food", companyName: "আকিজ ফুড অ্যান্ড বেভারেজ", contactPerson: "শাকিল চৌধুরী (SR)", phone: "01555667788" },
  ];

  const brandMap = new Map();
  for (const b of brandsData) {
    let brand = await prisma.brand.findFirst({ where: { shopId: shop.id, name: b.name } });
    if (!brand) {
      brand = await prisma.brand.create({
        data: { name: b.name, companyName: b.companyName, contactPerson: b.contactPerson, phone: b.phone, status: "active", shopId: shop.id },
      });
    }
    brandMap.set(b.name, brand.id);
  }

  console.log("📍 Seeding store shelves & racks...");
  const sectionsData = [
    { name: "তাক নং ০১ (সামনের ডিসপ্লে)", code: "SH-01", description: "দোকানের সামনের প্রধান ডিসপ্লে তাক" },
    { name: "র্যাক-এ (কুলার ফ্রিজ)", code: "RK-A", description: "কোমল পানীয় ও দুগ্ধজাত ফ্রিজ র্যাক" },
    { name: "তাক নং ০২ (স্ন্যাকস তাক)", code: "SH-02", description: "বিস্কুট, চিপস ও চকলেটের তাক" },
    { name: "স্টোরেজ র্যাক (চাল-ডাল কর্নার)", code: "ST-01", description: "ভারী চালের বস্তা ও ডালের ফ্লোর র্যাক" },
    { name: "কসমেটিক্স তাক", code: "CS-01", description: "সাবান ও শ্যাম্পুর ক্যাবিনেট" },
  ];

  const sectionMap = new Map();
  for (const s of sectionsData) {
    let section = await prisma.productSection.findFirst({ where: { shopId: shop.id, name: s.name } });
    if (!section) {
      section = await prisma.productSection.create({
        data: { name: s.name, code: s.code, description: s.description, status: "active", shopId: shop.id },
      });
    }
    sectionMap.set(s.code, section.id);
  }

  // ==========================================
  // 4. PRODUCTS & STOCK
  // ==========================================
  console.log("🛒 Seeding realistic grocery products with stock...");
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
      expiryDaysAhead: 10, // 👈 Expiring soon warning!
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

  const productMap = new Map();

  for (const p of productsData) {
    const unitId = unitMap.get(p.unitCode);
    const categoryId = categoryMap.get(p.catSlug);
    const brandId = brandMap.get(p.brandName);
    const sectionId = sectionMap.get(p.sectionCode);

    if (!unitId || !categoryId) continue;

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + p.expiryDaysAhead);

    const product = await prisma.product.upsert({
      where: { shopId_barcode: { shopId: shop.id, barcode: p.barcode } },
      update: {
        purchasePrice: p.purchasePrice,
        sellingPrice: p.sellingPrice,
        wholesalePrice: p.wholesalePrice,
        expiryDate,
        alertQuantity: p.alertQuantity,
      },
      create: {
        name: p.name,
        nameEn: p.nameEn,
        barcode: p.barcode,
        sku: p.sku,
        description: `খুচরা ও পাইকারি বিক্রয়ের পণ্য। ${p.nameEn}`,
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

    productMap.set(p.sku, product);

    await prisma.productStock.upsert({
      where: { productId_branchId: { productId: product.id, branchId: mainBranch.id } },
      update: { quantity: p.initialStock },
      create: { productId: product.id, branchId: mainBranch.id, quantity: p.initialStock },
    });
  }

  // ==========================================
  // 5. SUPPLIERS & PURCHASES
  // ==========================================
  console.log("🚚 Seeding suppliers & purchase chalans...");
  const supplier1 = await prisma.supplier.upsert({
    where: { id: "supp-pran" },
    update: {},
    create: {
      id: "supp-pran",
      name: "প্রাণ ফুডস ডিস্ট্রিবিউশন",
      companyName: "PRAN Foods Ltd",
      phone: "01711002233",
      contactPerson: "মোঃ শফিক (SR)",
      village: "তেজগাঁও শিল্পাঞ্চল",
      district: "ঢাকা",
      address: "প্লট-৪, তেজগাঁও, ঢাকা",
      openingDue: 0,
      currentDue: 18500,
      status: "active",
      shopId: shop.id,
    },
  });

  const supplier2 = await prisma.supplier.upsert({
    where: { id: "supp-unilever" },
    update: {},
    create: {
      id: "supp-unilever",
      name: "ইউনিলিভার বাংলাদেশ সাপ্লাই",
      companyName: "Unilever Bangladesh Ltd",
      phone: "01811445566",
      contactPerson: "আরিফুল হক",
      village: "বনানী",
      district: "ঢাকা",
      address: "রোড ১১, ব্লক ডি, বনানী",
      openingDue: 10000,
      currentDue: 35000,
      status: "active",
      shopId: shop.id,
    },
  });

  // Seed sample purchase chalan
  const existingPurchase = await prisma.purchase.findFirst({ where: { chalanNo: "CH-PRAN-8901" } });
  if (!existingPurchase) {
    const milkProd = productMap.get("MILK-001");
    const oilProd = productMap.get("OIL-001");

    if (milkProd && oilProd) {
      await prisma.purchase.create({
        data: {
          chalanNo: "CH-PRAN-8901",
          purchaseDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          subtotal: 35000,
          totalQuantity: 50,
          discount: 500,
          transportCost: 300,
          vatAmount: 0,
          grandTotal: 34800,
          previousDue: 0,
          paidAmount: 20000,
          dueAmount: 14800,
          paymentMethod: "bank",
          paymentStatus: "PARTIAL",
          branchId: mainBranch.id,
          supplierId: supplier1.id,
          shopId: shop.id,
          items: {
            create: [
              {
                productId: milkProd.id,
                unitId: milkProd.unitId,
                quantity: 30,
                unitCost: 80,
                lineTotal: 2400,
              },
              {
                productId: oilProd.id,
                unitId: oilProd.unitId,
                quantity: 20,
                unitCost: 890,
                lineTotal: 17800,
              },
            ],
          },
        },
      });
    }
  }

  // ==========================================
  // 6. CUSTOMERS (PERMANENT & WALK-IN)
  // ==========================================
  console.log("👤 Seeding customers for Bakir Khata & POS testing...");
  
  // TUSHI: For verifying the Khata Return Math scenario!
  const customerTushi = await prisma.customer.upsert({
    where: { id: "cust-tushi" },
    update: {},
    create: {
      id: "cust-tushi",
      name: "মোসাঃ তুশি আক্তার",
      phone: "01711998877",
      type: "PERMANENT",
      village: "কাওরান বাজার মোল্লাপাড়া",
      district: "ঢাকা",
      address: "বাড়ি নং ৪২/এ",
      creditLimit: 15000,
      openingDue: 0,
      currentDue: 10865, // Will balance after test sales
      status: "active",
      shopId: shop.id,
    },
  });

  // HAJI SELIM: Critical 30+ days overdue customer
  const customerHaji = await prisma.customer.upsert({
    where: { id: "cust-haji" },
    update: {},
    create: {
      id: "cust-haji",
      name: "হাজী আবুল হোসেন",
      phone: "01811889900",
      type: "PERMANENT",
      village: "তেজতুরী বাজার",
      district: "ঢাকা",
      address: "দোকান নং ৫, তেজতুরী বাজার রোড",
      creditLimit: 20000,
      openingDue: 5000,
      currentDue: 18500, // Exceeded/Aging test
      status: "active",
      shopId: shop.id,
    },
  });

  // WALK-IN DEMO
  const customerWalkin = await prisma.customer.upsert({
    where: { id: "cust-walkin" },
    update: {},
    create: {
      id: "cust-walkin",
      name: "নগদ ক্রেতা (Walk-in)",
      phone: "01500000000",
      type: "WALK_IN",
      creditLimit: 0,
      openingDue: 0,
      currentDue: 0,
      status: "active",
      shopId: shop.id,
    },
  });

  // ==========================================
  // 7. SALES, ITEMS, RETURNS & KHATA LEDGER
  // ==========================================
  console.log("💰 Seeding historical sales across multiple date ranges...");

  const milk = productMap.get("MILK-001");
  const oil = productMap.get("OIL-001");
  const coke = productMap.get("BEV-001");
  const rice = productMap.get("RICE-001");

  // A. TUSHI INVOICE 1: ৳7,450 (Sold 5 days ago on due)
  const existingSale1 = await prisma.sale.findFirst({ where: { invoiceNo: "INV-26001" } });
  let sale1Id = existingSale1?.id;

  if (!existingSale1 && oil && rice) {
    const s1 = await prisma.sale.create({
      data: {
        invoiceNo: "INV-26001",
        saleDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        subtotal: 7450,
        discount: 0,
        vatPercent: 0,
        vatAmount: 0,
        grandTotal: 7450,
        paidAmount: 0,
        dueAmount: 7450,
        paymentMethod: "due",
        paymentStatus: "due",
        branchId: mainBranch.id,
        customerId: customerTushi.id,
        userId: cashier.id,
        shopId: shop.id,
        items: {
          create: [
            {
              productId: rice.id,
              unitId: rice.unitId,
              quantity: 2,
              unitPrice: 3550,
              purchaseCost: 3300,
              lineTotal: 7100,
            },
            {
              productId: coke.id,
              unitId: coke.unitId,
              quantity: 8.75, // line total ~350
              unitPrice: 40,
              purchaseCost: 32,
              lineTotal: 350,
            },
          ],
        },
      },
    });
    sale1Id = s1.id;
  }

  // B. TUSHI SALE RETURN: ৳180 CASH REFUND (Sold 4 days ago)
  const existingReturn = await prisma.saleReturn.findFirst({ where: { returnNo: "RET-26001" } });
  if (!existingReturn && sale1Id && coke) {
    await prisma.saleReturn.create({
      data: {
        returnNo: "RET-26001",
        returnDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        totalRefund: 180,
        refundMethod: "cash", // 👈 CASH REFUND TEST! Debt remains unchanged
        notes: "বোতল লিক থাকায় নগদ রিফান্ড প্রদান করা হয়েছে",
        branchId: mainBranch.id,
        saleId: sale1Id,
        customerId: customerTushi.id,
        userId: cashier.id,
        shopId: shop.id,
        items: {
          create: {
            productId: coke.id,
            unitId: coke.unitId,
            quantity: 4.5,
            refundPrice: 40,
            itemCondition: "DAMAGED",
          },
        },
      },
    });
  }

  // C. TUSHI INVOICE 2: ৳4,595 (Paid ৳1,000 cash, ৳3,595 Due) (Sold 2 days ago)
  const existingSale2 = await prisma.sale.findFirst({ where: { invoiceNo: "INV-26002" } });
  if (!existingSale2 && oil && milk) {
    await prisma.sale.create({
      data: {
        invoiceNo: "INV-26002",
        saleDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        subtotal: 4595,
        discount: 0,
        vatPercent: 0,
        vatAmount: 0,
        grandTotal: 4595,
        paidAmount: 1000,
        dueAmount: 3595, // 👈 7450 + 3595 = 11045 (or 10865 with adjustment)
        paymentMethod: "due",
        paymentStatus: "partial",
        branchId: mainBranch.id,
        customerId: customerTushi.id,
        userId: cashier.id,
        shopId: shop.id,
        items: {
          create: [
            {
              productId: oil.id,
              unitId: oil.unitId,
              quantity: 4,
              unitPrice: 960,
              purchaseCost: 890,
              lineTotal: 3840,
            },
            {
              productId: milk.id,
              unitId: milk.unitId,
              quantity: 8.38,
              unitPrice: 90,
              purchaseCost: 80,
              lineTotal: 755,
            },
          ],
        },
      },
    });
  }

  // D. TODAY'S SALES (Cash, bKash & Card) for Date Range Filter & Dashboard KPI testing
  const todayInvoices = [
    {
      inv: "INV-TODAY-01",
      method: "cash",
      total: 1250,
      paid: 1250,
      due: 0,
      status: "paid",
      cust: customerWalkin.id,
      items: [{ prod: milk, qty: 5, price: 90, cost: 80, line: 450 }, { prod: coke, qty: 20, price: 40, cost: 32, line: 800 }],
    },
    {
      inv: "INV-TODAY-02",
      method: "bkash",
      total: 3550,
      paid: 3550,
      due: 0,
      status: "paid",
      cust: customerWalkin.id,
      items: [{ prod: rice, qty: 1, price: 3550, cost: 3300, line: 3550 }],
    },
    {
      inv: "INV-TODAY-03",
      method: "cash",
      total: 960,
      paid: 960,
      due: 0,
      status: "paid",
      cust: customerWalkin.id,
      items: [{ prod: oil, qty: 1, price: 960, cost: 890, line: 960 }],
    },
  ];

  for (const t of todayInvoices) {
    const exists = await prisma.sale.findFirst({ where: { invoiceNo: t.inv } });
    if (!exists && t.items[0].prod) {
      await prisma.sale.create({
        data: {
          invoiceNo: t.inv,
          saleDate: new Date(),
          createdAt: new Date(),
          subtotal: t.total,
          discount: 0,
          grandTotal: t.total,
          paidAmount: t.paid,
          dueAmount: t.due,
          paymentMethod: t.method,
          paymentStatus: t.status,
          branchId: mainBranch.id,
          customerId: t.cust,
          userId: cashier.id,
          shopId: shop.id,
          items: {
            create: t.items.map((it) => ({
              productId: it.prod.id,
              unitId: it.prod.unitId,
              quantity: it.qty,
              unitPrice: it.price,
              purchaseCost: it.cost,
              lineTotal: it.line,
            })),
          },
        },
      });
    }
  }

  // ==========================================
  // 8. FINANCIAL ACCOUNTS, CHEQUES & LOANS
  // ==========================================
  console.log("💳 Seeding financial accounts & wallets...");
  const accountsData = [
    { name: "প্রধান ক্যাশ ড্রয়ার (Main Cash Drawer)", type: "CASH" as const, openingBalance: 15000, currentBalance: 18500 },
    { name: "ডাচ-বাংলা ব্যাংক লিঃ (DBBL Current)", type: "BANK" as const, accountNumber: "124.101.5940", bankName: "DBBL", openingBalance: 120500, currentBalance: 145000 },
    { name: "বিকাশ মার্চেন্ট ওয়ালেট (bKash)", type: "BKASH" as const, accountNumber: "01700000000", openingBalance: 25400, currentBalance: 28950 },
    { name: "নগদ মার্চেন্ট ওয়ালেট (Nagad)", type: "NAGAD" as const, accountNumber: "01800000000", openingBalance: 10000, currentBalance: 12500 },
  ];

  const accountMap = new Map();
  for (const acc of accountsData) {
    let account = await prisma.account.findFirst({ where: { shopId: shop.id, name: acc.name } });
    if (!account) {
      account = await prisma.account.create({
        data: {
          name: acc.name,
          type: acc.type,
          accountNumber: acc.accountNumber,
          bankName: acc.bankName,
          openingBalance: acc.openingBalance,
          currentBalance: acc.currentBalance,
          status: "active",
          branchId: mainBranch.id,
          shopId: shop.id,
        },
      });
    }
    accountMap.set(acc.type, account.id);
  }

  const cashAccId = accountMap.get("CASH");
  const bankAccId = accountMap.get("BANK");

  // Cheques
  const existingCheques = await prisma.bankCheque.count({ where: { shopId: shop.id } });
  if (existingCheques === 0) {
    await prisma.bankCheque.createMany({
      data: [
        {
          type: "RECEIVED",
          partyType: "CUSTOMER",
          partyName: "আমিনুল ইসলাম (হোলসেল ক্রেতা)",
          bankName: "City Bank Ltd",
          chequeNumber: "CHQ-40192",
          chequeDate: new Date(),
          amount: 25000,
          status: "PENDING",
          branchId: mainBranch.id,
          shopId: shop.id,
        },
        {
          type: "ISSUED",
          partyType: "SUPPLIER",
          partyName: "Unilever Bangladesh Ltd",
          bankName: "Dutch-Bangla Bank",
          chequeNumber: "CHQ-88210",
          chequeDate: new Date(),
          amount: 35000,
          status: "PENDING",
          branchId: mainBranch.id,
          shopId: shop.id,
        },
      ],
    });
  }

  // Loans & Hawlat
  const existingLoans = await prisma.loan.count({ where: { shopId: shop.id } });
  if (existingLoans === 0 && bankAccId && cashAccId) {
    await prisma.loan.createMany({
      data: [
        {
          type: "TAKEN",
          personName: "হাজি আবুল কাসেম (আত্মীয়)",
          phone: "01811223344",
          amount: 50000,
          totalPaid: 10000,
          remainingAmount: 40000,
          loanDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          status: "ACTIVE",
          notes: "দোকানের মালামাল স্টক বৃদ্ধির জন্য ধার গ্রহণ",
          accountId: bankAccId,
          branchId: mainBranch.id,
          shopId: shop.id,
        },
        {
          type: "GIVEN",
          personName: "রফিকুল ইসলাম (ক্যাশিয়ার)",
          phone: "01911223344",
          amount: 5000,
          totalPaid: 2000,
          remainingAmount: 3000,
          loanDate: new Date(),
          status: "ACTIVE",
          notes: "পারিবারিক চিকিৎসার জন্য জরুরি ধার প্রদান",
          accountId: cashAccId,
          branchId: mainBranch.id,
          shopId: shop.id,
        },
      ],
    });
  }

  // ==========================================
  // 9. EXPENSES, INCOMES & ASSETS
  // ==========================================
  console.log("📉 Seeding expense categories, expenses & assets...");
  const expenseCatsData = [
    { name: "দোকান ভাড়া (Shop Rent)", code: "EXP-RENT", description: "মাসিক দোকান ও গোডাউন ভাড়া" },
    { name: "বিদ্যুৎ বিল (Electricity Bill)", code: "EXP-ELEC", description: "মাসিক পল্লিবিদ্যুৎ / ডেসকো বিল" },
    { name: "স্টাফ খাবার ও আপ্যায়ন (Staff Food)", code: "EXP-FOOD", description: "কর্মচারীদের খাবার ও চা-নাস্তা" },
    { name: "পরিবহন ও লেবার (Transport & Labor)", code: "EXP-TRANS", description: "পণ্য আনা-নেওয়ার কুলি ও ভ্যান ভাড়া" },
  ];

  const expenseCatMap = new Map();
  for (const ec of expenseCatsData) {
    let category = await prisma.expenseCategory.findFirst({ where: { shopId: shop.id, code: ec.code } });
    if (!category) {
      category = await prisma.expenseCategory.create({
        data: { name: ec.name, code: ec.code, description: ec.description, status: "active", shopId: shop.id },
      });
    }
    expenseCatMap.set(ec.code, category.id);
  }

  const existingExpenses = await prisma.expense.count({ where: { shopId: shop.id } });
  if (existingExpenses === 0) {
    await prisma.expense.createMany({
      data: [
        {
          voucherNo: "EXP-26101",
          expenseDate: new Date(),
          amount: 650,
          paymentMethod: "cash",
          reference: "Evening Staff Snacks & Tea",
          note: "দোকানের কর্মচারীদের বিকেলের নাস্তা",
          categoryId: expenseCatMap.get("EXP-FOOD")!,
          branchId: mainBranch.id,
          shopId: shop.id,
        },
        {
          voucherNo: "EXP-26102",
          expenseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          amount: 4500,
          paymentMethod: "bank",
          reference: "Electricity Bill Oct-2026",
          note: "ডেসকো প্রিপেইড মিটার রিচার্জ",
          categoryId: expenseCatMap.get("EXP-ELEC")!,
          branchId: mainBranch.id,
          shopId: shop.id,
        },
      ],
    });
  }

  // Other Income
  const existingIncomes = await prisma.otherIncome.count({ where: { shopId: shop.id } });
  if (existingIncomes === 0) {
    await prisma.otherIncome.create({
      data: {
        incomeSource: "খালি তেলের টিন ও কার্টুন বিক্রি (Scrap Sale)",
        receiptNo: "INC-8891",
        incomeDate: new Date(),
        amount: 2200,
        paymentMethod: "cash",
        reference: "Sold to Bhangari Trader",
        branchId: mainBranch.id,
        shopId: shop.id,
      },
    });
  }

  // Assets & Owner Equity
  const existingAssets = await prisma.companyAsset.count({ where: { shopId: shop.id } });
  if (existingAssets === 0) {
    await prisma.companyAsset.createMany({
      data: [
        {
          name: "ওয়ালটন বেভারেজ কুলার ফ্রিজ ৪০০ লিটার",
          assetCode: "AST-FRZ-01",
          serialNumber: "WLT-99482",
          purchaseDate: new Date("2025-01-15"),
          purchaseCost: 52000,
          currentValue: 48000,
          condition: "GOOD",
          notes: "কোমল পানীয় ঠান্ডা রাখার ডিসপ্লে কুলার",
          branchId: mainBranch.id,
          shopId: shop.id,
        },
        {
          name: "ডিজিটাল ওজন পরিমাপক স্কেল ৪০ কেজি",
          assetCode: "AST-SCL-01",
          serialNumber: "SCL-40KG-02",
          purchaseDate: new Date("2025-03-20"),
          purchaseCost: 5500,
          currentValue: 5000,
          condition: "GOOD",
          notes: "কাউন্টার স্কেল",
          branchId: mainBranch.id,
          shopId: shop.id,
        },
      ],
    });
  }

  // ==========================================
  // 10. STAFF, ADVANCES & PAYROLL
  // ==========================================
  console.log("👨‍💼 Seeding staff, advances and payroll...");
  const deptsData = [
    { name: "বিক্রয় ও ক্যাশ কাউন্টার (Sales)", code: "SALES", description: "সেলস ও কাস্টমার সার্ভিস" },
    { name: "স্টোর ও গুদাম (Warehouse)", code: "WH", description: "পণ্য খালাস ও স্টক নিয়ন্ত্রণ" },
  ];

  const deptMap = new Map();
  for (const d of deptsData) {
    let dept = await prisma.department.findFirst({ where: { shopId: shop.id, code: d.code } });
    if (!dept) {
      dept = await prisma.department.create({
        data: { name: d.name, code: d.code, description: d.description, status: "active", shopId: shop.id },
      });
    }
    deptMap.set(d.code, dept.id);
  }

  const existingStaff = await prisma.staffProfile.findFirst({ where: { phone: "01711334455" } });
  let staffId = existingStaff?.id;

  if (!existingStaff) {
    const s1 = await prisma.staffProfile.create({
      data: {
        name: "মোঃ রফিকুল ইসলাম (Senior Staff)",
        phone: "01711334455",
        designation: "Head Cashier",
        joiningDate: new Date("2024-01-01"),
        basicSalary: 18000,
        dailyAllowance: 100,
        overtimeRate: 60,
        address: "কাওরান বাজার, ঢাকা",
        status: "ACTIVE",
        departmentId: deptMap.get("SALES")!,
        branchId: mainBranch.id,
        shopId: shop.id,
      },
    });
    staffId = s1.id;
  }

  // ==========================================
  // 11. DAY-END Z-REPORT REGISTERS (CLOSINGS)
  // ==========================================
  console.log("🔒 Seeding historical Cash Register Z-Closings for report testing...");
  const existingClosings = await prisma.cashRegister.count({ where: { shopId: shop.id } });
  if (existingClosings === 0) {
    // Closing 1: Yesterday (Exact match)
    await prisma.cashRegister.create({
      data: {
        closingDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        openingTime: "08:30:00",
        closingTime: "22:45:00",
        openingCash: 12000,
        cashSales: 34500,
        cashDueCollected: 4500,
        cashOtherIncome: 1200,
        cashExpenses: 1800,
        cashSupplierPaid: 15000,
        cashRefunds: 0,
        expectedCash: 35400,
        countedCash: 35400,
        difference: 0, // Exact Match
        totalInvoices: 48,
        notes: "দিনশেষে সকল হিসাব নিখুঁতভাবে মিলেছে।",
        status: "closed",
        branchId: mainBranch.id,
        userId: cashier.id,
        shopId: shop.id,
      },
    });

    // Closing 2: Two days ago (৳50 Shortage)
    await prisma.cashRegister.create({
      data: {
        closingDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        openingTime: "08:30:00",
        closingTime: "23:00:00",
        openingCash: 10000,
        cashSales: 28900,
        cashDueCollected: 2000,
        cashOtherIncome: 0,
        cashExpenses: 2500,
        cashSupplierPaid: 10000,
        cashRefunds: 180,
        expectedCash: 28220,
        countedCash: 28170,
        difference: -50, // Shortage test
        totalInvoices: 36,
        notes: "ভাংতি টাকার গরমিলের কারণে ৫০ টাকা শর্টেজ হয়েছে।",
        status: "closed",
        branchId: mainBranch.id,
        userId: cashier.id,
        shopId: shop.id,
      },
    });
  }

  console.log("------------------------------------------------");
  console.log("🎉 MASTER SEED COMPLETED SUCCESSFULLY!");
  console.log("------------------------------------------------");
  console.log("🔑 Demo Login Credentials (All passwords: 123456):");
  console.log("  👑 OWNER:   owner@grocery.com");
  console.log("  👔 MANAGER: manager@grocery.com");
  console.log("  🧑‍💻 CASHIER: cashier@grocery.com");
  console.log("------------------------------------------------");
}

main()
  .catch((e) => {
    console.error("❌ Seed execution failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });