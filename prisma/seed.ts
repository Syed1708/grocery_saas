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

async function cleanDatabase() {
  console.log("🧹 [0/12] Cleaning previous database records...");
  
  // Disable foreign key checks for safe truncation in MySQL
  await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0;`);

  // Delete all transactional, family, and operational tables
  await prisma.partnerRationItem.deleteMany().catch(() => {});
  await prisma.partnerRation.deleteMany().catch(() => {});
  await prisma.partnerTransaction.deleteMany().catch(() => {});
  await prisma.partner.deleteMany().catch(() => {});

  await prisma.saleReturnItem.deleteMany().catch(() => {});
  await prisma.saleReturn.deleteMany().catch(() => {});
  await prisma.saleItem.deleteMany().catch(() => {});
  await prisma.sale.deleteMany().catch(() => {});
  await prisma.purchaseItem.deleteMany().catch(() => {});
  await prisma.purchase.deleteMany().catch(() => {});
  await prisma.productStock.deleteMany().catch(() => {});
  await prisma.product.deleteMany().catch(() => {});
  await prisma.productSection.deleteMany().catch(() => {});
  await prisma.brand.deleteMany().catch(() => {});
  await prisma.category.deleteMany().catch(() => {});
  await prisma.unit.deleteMany().catch(() => {});
  await prisma.customerPayment.deleteMany().catch(() => {});
  await prisma.customer.deleteMany().catch(() => {});
  await prisma.supplierPayment.deleteMany().catch(() => {});
  await prisma.supplier.deleteMany().catch(() => {});
  await prisma.cashRegister.deleteMany().catch(() => {});
  await prisma.expense.deleteMany().catch(() => {});
  await prisma.expenseCategory.deleteMany().catch(() => {});
  await prisma.otherIncome.deleteMany().catch(() => {});
  await prisma.companyAsset.deleteMany().catch(() => {});
  await prisma.loanInstallment.deleteMany().catch(() => {});
  await prisma.loan.deleteMany().catch(() => {});
  await prisma.bankCheque.deleteMany().catch(() => {});
  await prisma.accountTransaction.deleteMany().catch(() => {});
  await prisma.account.deleteMany().catch(() => {});
  await prisma.salaryAdvance.deleteMany().catch(() => {});
  await prisma.payroll.deleteMany().catch(() => {});
  await prisma.staffProfile.deleteMany().catch(() => {});
  await prisma.department.deleteMany().catch(() => {});
  await prisma.user.deleteMany().catch(() => {});
  await prisma.branch.deleteMany().catch(() => {});
  await prisma.shop.deleteMany().catch(() => {});

  // Re-enable foreign key constraints
  await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1;`);
  console.log("✨ Database completely cleared!");
}

async function main() {
  await cleanDatabase();

  console.log("🌱 Starting Master Multi-Branch Grocery Store Seed...");

  // ==========================================
  // 1. STORE & MULTI-BRANCH SETUP
  // ==========================================
  console.log("🏪 [1/12] Setting up Shop & Outlets...");
  const shop = await prisma.shop.create({
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

  const mainBranch = await prisma.branch.create({
    data: {
      name: "Main Branch (কাওরান বাজার প্রধান শাখা)",
      code: "MAIN",
      phone: "01700000000",
      address: "দোকান ১২, কাওরান বাজার, ঢাকা",
      isMain: true,
      status: "active",
      shopId: shop.id,
    },
  });

  const mirpurBranch = await prisma.branch.create({
    data: {
      name: "Mirpur Branch (মিরপুর-১০ আউটলেট)",
      code: "MIRPUR",
      phone: "01700000011",
      address: "প্লট ৪, ব্লক সি, মিরপুর-১০, ঢাকা",
      isMain: false,
      status: "active",
      shopId: shop.id,
    },
  });

  // ==========================================
  // 2. USERS (RBAC)
  // ==========================================
  console.log("👥 [2/12] Seeding RBAC Users across Branches...");
  const hashedPassword = await bcrypt.hash("123456", 10);

  const users = [
    { email: "owner@grocery.com", name: "Haji Mohammad Selim (Owner)", role: "OWNER", branchId: mainBranch.id, phone: "01700000000" },
    { email: "manager@grocery.com", name: "Kazi Faruk (Main Manager)", role: "MANAGER", branchId: mainBranch.id, phone: "01800000001" },
    { email: "cashier@grocery.com", name: "Rafiqul Islam (Main Cashier)", role: "CASHIER", branchId: mainBranch.id, phone: "01900000001" },
    { email: "manager.mirpur@grocery.com", name: "Tariqul Hasan (Mirpur Manager)", role: "MANAGER", branchId: mirpurBranch.id, phone: "01800000002" },
    { email: "cashier.mirpur@grocery.com", name: "Sumon Molla (Mirpur Cashier)", role: "CASHIER", branchId: mirpurBranch.id, phone: "01900000002" },
  ];

  const userMap = new Map();
  for (const u of users) {
    const user = await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        password: hashedPassword,
        phone: u.phone,
        role: u.role as any,
        shopId: shop.id,
        branchId: u.branchId,
        isActive: true,
      },
    });
    userMap.set(u.email, user);
  }

  const cashierUser = userMap.get("cashier@grocery.com")!;
  const mirpurCashierUser = userMap.get("cashier.mirpur@grocery.com")!;

  // ==========================================
  // 3. CATALOG SETUP
  // ==========================================
  console.log("📦 [3/12] Seeding Measurement Units, Categories, Brands & Racks...");
  for (const u of DEFAULT_UNITS) {
    await prisma.unit.create({
      data: { name: u.name, shortCode: u.shortCode, allowDecimal: u.allowDecimal, shopId: shop.id },
    });
  }

  const unitMap = new Map();
  (await prisma.unit.findMany({ where: { shopId: shop.id } })).forEach((u) => unitMap.set(u.shortCode, u.id));

  const categoriesData = [
    { name: "ডেইরি ও তরল দুধ", slug: "dairy-milk", description: "তরল দুধ, মাখন, ঘি ও পনির" },
    { name: "পানীয় ও জুস", slug: "beverages", description: "কোল্ড ড্রিংকস, মিনারেল ওয়াটার ও ফলের জুস" },
    { name: "চাল, ডাল ও আটা", slug: "rice-grains", description: "মিনিকেট চাল, মসুর ডাল, খোলা আটা" },
    { name: "স্ন্যাকস ও বিস্কুট", slug: "snacks-biscuits", description: "চিপস, কুকিজ ও কনফেকশনারি" },
    { name: "রান্নার তেল ও মশলা", slug: "cooking-essentials", description: "সয়াবিন তেল, হলুদ, মরিচ গুঁড়া, মসলা" },
    { name: "প্রসাধন ও টয়লেট্রিজ", slug: "personal-care", description: "সাবান, শ্যাম্পু ও টুথপেস্ট" },
    { name: "পরিষ্কার পরিচ্ছন্নতা সামগ্রী", slug: "cleaning-hygiene", description: "ডিটারজেন্ট, ডিশওয়াশ ও হারপিক" },
    { name: "শিশু খাদ্য ও যত্ন", slug: "baby-care", description: "সেরিল্যাক, ডায়পার ও বেবি লোশন" },
  ];

  const categoryMap = new Map();
  for (const cat of categoriesData) {
    const c = await prisma.category.create({
      data: { name: cat.name, slug: cat.slug, description: cat.description, status: "active", shopId: shop.id },
    });
    categoryMap.set(cat.slug, c.id);
  }

  const brandsData = [
    { name: "Pran Foods", companyName: "প্রাণ-আরএফএল গ্রুপ", contactPerson: "মোঃ রফিকুল ইসলাম (SR)", phone: "01711223344" },
    { name: "Unilever", companyName: "ইউনিলিভার বাংলাদেশ লিঃ", contactPerson: "তানভীর হাসান (SR)", phone: "01822334455" },
    { name: "Square", companyName: "স্কয়ার কনজিউমার প্রডাক্টস", contactPerson: "কামরুল ইসলাম (SR)", phone: "01933445566" },
    { name: "Nestlé", companyName: "নেসলে বাংলাদেশ", contactPerson: "ফারুক আহমেদ (SR)", phone: "01644556677" },
    { name: "Akij Food", companyName: "আকিজ ফুড অ্যান্ড বেভারেজ", contactPerson: "শাকিল চৌধুরী (SR)", phone: "01555667788" },
    { name: "Meghna (Fresh)", companyName: "মেঘনা গ্রুপ অফ ইন্ডাস্ট্রিজ", contactPerson: "জাহিদুল হক (SR)", phone: "01788990011" },
  ];

  const brandMap = new Map();
  for (const b of brandsData) {
    const brand = await prisma.brand.create({
      data: { name: b.name, companyName: b.companyName, contactPerson: b.contactPerson, phone: b.phone, status: "active", shopId: shop.id },
    });
    brandMap.set(b.name, brand.id);
  }

  const sectionsData = [
    { name: "তাক নং ০১ (সামনের ডিসপ্লে)", code: "SH-01", description: "সামনের প্রধান ডিসপ্লে তাক" },
    { name: "র্যাক-এ (কুলার ফ্রিজ)", code: "RK-A", description: "কোমল পানীয় ও দুগ্ধজাত ফ্রিজ র্যাক" },
    { name: "তাক নং ০২ (স্ন্যাকস তাক)", code: "SH-02", description: "বিস্কুট, চিপস ও চকলেটের তাক" },
    { name: "স্টোরেজ র্যাক (চাল-ডাল কর্নার)", code: "ST-01", description: "ভারী চালের বস্তা ও ডালের ফ্লোর র্যাক" },
    { name: "কসমেটিক্স তাক", code: "CS-01", description: "সাবান ও শ্যাম্পুর ক্যাবিনেট" },
    { name: "ক্লিনিং কর্নার", code: "CLN-01", description: "ডিটারজেন্ট ও ফ্লোর ক্লিনার তাক" },
  ];

  const sectionMap = new Map();
  for (const s of sectionsData) {
    const section = await prisma.productSection.create({
      data: { name: s.name, code: s.code, description: s.description, status: "active", shopId: shop.id },
    });
    sectionMap.set(s.code, section.id);
  }

  // ==========================================
  // 4. RICH PRODUCT CATALOG (32 ITEMS)
  // ==========================================
  console.log("🛒 [4/12] Seeding 32 Products with Expiry & Multi-Branch Stock...");
  const rawProducts = [
    { name: "আড়ং তরল দুধ ১ লিটার", nameEn: "Aarong Liquid Milk 1L", barcode: "890100100101", sku: "MILK-001", purchasePrice: 80, sellingPrice: 90, wholesalePrice: 85, vat: 0, expDays: 4, alert: 15, stockMain: 40, stockMirpur: 20, u: "ltr", cat: "dairy-milk", b: "Pran Foods", sec: "RK-A" },
    { name: "কোকাকোলা ৫০০ মিলি", nameEn: "Coca-Cola 500ml Pet", barcode: "890100100102", sku: "BEV-001", purchasePrice: 32, sellingPrice: 40, wholesalePrice: 36, vat: 5, expDays: 180, alert: 20, stockMain: 120, stockMirpur: 60, u: "pcs", cat: "beverages", b: "Akij Food", sec: "RK-A" },
    { name: "প্রাণ ফ্রুটো ম্যাঙ্গো জুস ২৫০ মিলি", nameEn: "Pran Frooto Mango 250ml", barcode: "890100100103", sku: "BEV-002", purchasePrice: 22, sellingPrice: 30, wholesalePrice: 26, vat: 0, expDays: 90, alert: 15, stockMain: 96, stockMirpur: 48, u: "pcs", cat: "beverages", b: "Pran Foods", sec: "RK-A" },
    { name: "মিনিকেট চাল প্রিমিয়াম ৫০ কেজি বস্তা", nameEn: "Miniket Rice Premium 50kg Sack", barcode: "890100100104", sku: "RICE-001", purchasePrice: 3300, sellingPrice: 3550, wholesalePrice: 3450, vat: 0, expDays: 365, alert: 5, stockMain: 28, stockMirpur: 12, u: "bag", cat: "rice-grains", b: "Square", sec: "ST-01" },
    { name: "তীর সয়াবিন তেল ৫ লিটার বোতল", nameEn: "Teer Fortified Soybean Oil 5L", barcode: "890100100105", sku: "OIL-001", purchasePrice: 890, sellingPrice: 960, wholesalePrice: 920, vat: 0, expDays: 270, alert: 8, stockMain: 30, stockMirpur: 15, u: "ltr", cat: "cooking-essentials", b: "Square", sec: "SH-01" },
    { name: "রাধুনী খাঁটি হলুদ গুঁড়া ২০০ গ্রাম", nameEn: "Radhuni Turmeric Powder 200g", barcode: "890100100106", sku: "SPICE-001", purchasePrice: 65, sellingPrice: 75, wholesalePrice: 70, vat: 0, expDays: 300, alert: 10, stockMain: 55, stockMirpur: 25, u: "pkt", cat: "cooking-essentials", b: "Square", sec: "SH-01" },
    { name: "লাক্স সাবান ভেলভেট টাচ ১০০ গ্রাম", nameEn: "Lux Velvet Touch Soap 100g", barcode: "890100100107", sku: "SOAP-001", purchasePrice: 56, sellingPrice: 65, wholesalePrice: 60, vat: 7.5, expDays: 400, alert: 15, stockMain: 75, stockMirpur: 35, u: "pcs", cat: "personal-care", b: "Unilever", sec: "CS-01" },
    { name: "ওরিয়ো চকলেট বিস্কুট ১২০ গ্রাম", nameEn: "Oreo Chocolate Cream Biscuit 120g", barcode: "890100100108", sku: "SNACK-001", purchasePrice: 40, sellingPrice: 50, wholesalePrice: 45, vat: 0, expDays: 120, alert: 15, stockMain: 3, stockMirpur: 2, u: "pkt", cat: "snacks-biscuits", b: "Nestlé", sec: "SH-02" }, // LOW STOCK
    { name: "ফ্রেশ রিফাইন্ড সাদা চিনি ১ কেজি", nameEn: "Fresh Refined White Sugar 1kg", barcode: "890100100109", sku: "SUGAR-001", purchasePrice: 125, sellingPrice: 135, wholesalePrice: 130, vat: 0, expDays: 400, alert: 20, stockMain: 95, stockMirpur: 40, u: "kg", cat: "cooking-essentials", b: "Meghna (Fresh)", sec: "SH-01" },
    { name: "ম্যাগি ২-মিনিট নুডলস ৮ প্যাক", nameEn: "Maggi 2-Minute Noodles 8-Pack", barcode: "890100100110", sku: "NOOD-001", purchasePrice: 140, sellingPrice: 165, wholesalePrice: 150, vat: 0, expDays: 180, alert: 10, stockMain: 35, stockMirpur: 18, u: "pkt", cat: "snacks-biscuits", b: "Nestlé", sec: "SH-02" },
    { name: "প্রাণ পাস্তুরিত দুধ ৫০০ মিলি", nameEn: "Pran UHT Milk 500ml", barcode: "890100100111", sku: "MILK-002", purchasePrice: 42, sellingPrice: 50, wholesalePrice: 46, vat: 0, expDays: -3, alert: 10, stockMain: 12, stockMirpur: 5, u: "pcs", cat: "dairy-milk", b: "Pran Foods", sec: "RK-A" }, // EXPIRED DEMO
    { name: "আড়ং গাওয়া ঘি ২০০ গ্রাম", nameEn: "Aarong Pure Ghee 200g", barcode: "890100100112", sku: "GHEE-001", purchasePrice: 310, sellingPrice: 350, wholesalePrice: 330, vat: 5, expDays: 240, alert: 5, stockMain: 18, stockMirpur: 8, u: "pcs", cat: "dairy-milk", b: "Pran Foods", sec: "RK-A" },
    { name: "স্প্রাইট ৫০০ মিলি", nameEn: "Sprite 500ml Pet", barcode: "890100100113", sku: "BEV-003", purchasePrice: 32, sellingPrice: 40, wholesalePrice: 36, vat: 5, expDays: 180, alert: 15, stockMain: 85, stockMirpur: 40, u: "pcs", cat: "beverages", b: "Akij Food", sec: "RK-A" },
    { name: "মুম মিনারেল ওয়াটার ৫০০ মিলি", nameEn: "Mum Mineral Water 500ml", barcode: "890100100114", sku: "BEV-004", purchasePrice: 14, sellingPrice: 20, wholesalePrice: 17, vat: 0, expDays: 365, alert: 24, stockMain: 150, stockMirpur: 80, u: "pcs", cat: "beverages", b: "Square", sec: "RK-A" },
    { name: "নাজিরশাইল চাল ২৫ কেজি বস্তা", nameEn: "Nazirshail Rice 25kg", barcode: "890100100115", sku: "RICE-002", purchasePrice: 1850, sellingPrice: 2050, wholesalePrice: 1950, vat: 0, expDays: 365, alert: 6, stockMain: 20, stockMirpur: 10, u: "bag", cat: "rice-grains", b: "Meghna (Fresh)", sec: "ST-01" },
    { name: "তীর আটা ২ কেজি প্যাকেট", nameEn: "Teer Atta 2kg Packet", barcode: "890100100116", sku: "FLR-001", purchasePrice: 105, sellingPrice: 120, wholesalePrice: 112, vat: 0, expDays: 180, alert: 15, stockMain: 45, stockMirpur: 25, u: "pkt", cat: "rice-grains", b: "Square", sec: "ST-01" },
    { name: "দেশি মসুর ডাল ১ কেজি", nameEn: "Deshi Red Lentils 1kg", barcode: "890100100117", sku: "LNT-001", purchasePrice: 125, sellingPrice: 145, wholesalePrice: 135, vat: 0, expDays: 240, alert: 20, stockMain: 65, stockMirpur: 30, u: "kg", cat: "rice-grains", b: "Pran Foods", sec: "ST-01" },
    { name: "রূপচাঁদা সয়াবিন তেল ২ লিটার", nameEn: "Rupchanda Soybean Oil 2L", barcode: "890100100118", sku: "OIL-002", purchasePrice: 365, sellingPrice: 395, wholesalePrice: 380, vat: 0, expDays: 270, alert: 10, stockMain: 25, stockMirpur: 14, u: "ltr", cat: "cooking-essentials", b: "Square", sec: "SH-01" },
    { name: "রাধুনী খাঁটি সরিষার তেল ৫০০ মিলি", nameEn: "Radhuni Mustard Oil 500ml", barcode: "890100100119", sku: "OIL-003", purchasePrice: 160, sellingPrice: 185, wholesalePrice: 172, vat: 0, expDays: 300, alert: 12, stockMain: 40, stockMirpur: 18, u: "pcs", cat: "cooking-essentials", b: "Square", sec: "SH-01" },
    { name: "রাধুনী মরিচ গুঁড়া ২০০ গ্রাম", nameEn: "Radhuni Chilli Powder 200g", barcode: "890100100120", sku: "SPICE-002", purchasePrice: 85, sellingPrice: 98, wholesalePrice: 92, vat: 0, expDays: 300, alert: 10, stockMain: 48, stockMirpur: 20, u: "pkt", cat: "cooking-essentials", b: "Square", sec: "SH-01" },
    { name: "মোল্লা সুপার সল্ট ১ কেজি", nameEn: "Molla Super Salt 1kg", barcode: "890100100121", sku: "SLT-001", purchasePrice: 34, sellingPrice: 42, wholesalePrice: 38, vat: 0, expDays: 500, alert: 25, stockMain: 110, stockMirpur: 50, u: "kg", cat: "cooking-essentials", b: "Square", sec: "SH-01" },
    { name: "অলিম্পিক এনার্জি প্লাস বিস্কুট", nameEn: "Olympic Energy Plus", barcode: "890100100122", sku: "SNACK-002", purchasePrice: 28, sellingPrice: 35, wholesalePrice: 31, vat: 0, expDays: 150, alert: 15, stockMain: 60, stockMirpur: 30, u: "pkt", cat: "snacks-biscuits", b: "Pran Foods", sec: "SH-02" },
    { name: "লেক্সাস ভেজিটেবল বিস্কুট", nameEn: "Lexus Vegetable Biscuit", barcode: "890100100123", sku: "SNACK-003", purchasePrice: 42, sellingPrice: 50, wholesalePrice: 46, vat: 0, expDays: 150, alert: 10, stockMain: 45, stockMirpur: 22, u: "pkt", cat: "snacks-biscuits", b: "Akij Food", sec: "SH-02" },
    { name: "লাইফবয় টোটাল সাবান ১০০ গ্রাম", nameEn: "Lifebuoy Total Soap 100g", barcode: "890100100124", sku: "SOAP-002", purchasePrice: 48, sellingPrice: 55, wholesalePrice: 51, vat: 7.5, expDays: 400, alert: 20, stockMain: 80, stockMirpur: 40, u: "pcs", cat: "personal-care", b: "Unilever", sec: "CS-01" },
    { name: "সানসিল্ক ব্ল্যাক শাইন শ্যাম্পু ১৮০ মিলি", nameEn: "Sunsilk Black Shampoo 180ml", barcode: "890100100125", sku: "SMP-001", purchasePrice: 190, sellingPrice: 220, wholesalePrice: 205, vat: 7.5, expDays: 450, alert: 8, stockMain: 28, stockMirpur: 14, u: "pcs", cat: "personal-care", b: "Unilever", sec: "CS-01" },
    { name: "ক্লোজআপ রেড হট টুথপেস্ট ১০০ গ্রাম", nameEn: "Closeup Red Hot 100g", barcode: "890100100126", sku: "PST-001", purchasePrice: 95, sellingPrice: 115, wholesalePrice: 105, vat: 7.5, expDays: 365, alert: 10, stockMain: 2, stockMirpur: 1, u: "pcs", cat: "personal-care", b: "Unilever", sec: "CS-01" },
    { name: "হুইল ওয়াশিং পাউডার ১ কেজি", nameEn: "Wheel Washing Powder 1kg", barcode: "890100100127", sku: "CLN-001", purchasePrice: 125, sellingPrice: 140, wholesalePrice: 132, vat: 5, expDays: 500, alert: 15, stockMain: 65, stockMirpur: 30, u: "kg", cat: "cleaning-hygiene", b: "Unilever", sec: "CLN-01" },
    { name: "হারপিক টয়লেট ক্লিনার ৫০০ মিলি", nameEn: "Harpic Toilet Cleaner 500ml", barcode: "890100100128", sku: "CLN-002", purchasePrice: 110, sellingPrice: 130, wholesalePrice: 120, vat: 5, expDays: 400, alert: 12, stockMain: 42, stockMirpur: 20, u: "pcs", cat: "cleaning-hygiene", b: "Square", sec: "CLN-01" },
    { name: "ভিম লিকুইড ডিশওয়াশ ৫০০ মিলি", nameEn: "Vim Liquid Dishwash 500ml", barcode: "890100100129", sku: "CLN-003", purchasePrice: 130, sellingPrice: 150, wholesalePrice: 140, vat: 5, expDays: 360, alert: 10, stockMain: 38, stockMirpur: 18, u: "pcs", cat: "cleaning-hygiene", b: "Unilever", sec: "CLN-01" },
    { name: "সেরিল্যাক গম ও ৩ ফল ৪০০ গ্রাম", nameEn: "Cerelac Wheat & 3 Fruits 400g", barcode: "890100100130", sku: "BBY-001", purchasePrice: 420, sellingPrice: 480, wholesalePrice: 450, vat: 0, expDays: 180, alert: 6, stockMain: 18, stockMirpur: 8, u: "pcs", cat: "baby-care", b: "Nestlé", sec: "SH-01" },
    { name: "টুইঙ্কল বেবি ডায়াপার লার্জ ৩২ পিস", nameEn: "Twinkle Baby Diaper Large 32s", barcode: "890100100131", sku: "BBY-002", purchasePrice: 720, sellingPrice: 850, wholesalePrice: 780, vat: 5, expDays: 500, alert: 5, stockMain: 22, stockMirpur: 10, u: "pkt", cat: "baby-care", b: "Square", sec: "ST-01" },
    { name: "ডানো ডেইলি পুষ্টি মিল্ক পাউডার ৫০০ গ্রাম", nameEn: "Dano Daily Pushti 500g", barcode: "890100100132", sku: "MILK-003", purchasePrice: 380, sellingPrice: 430, wholesalePrice: 405, vat: 0, expDays: 365, alert: 10, stockMain: 30, stockMirpur: 15, u: "pkt", cat: "dairy-milk", b: "Pran Foods", sec: "SH-01" },
  ];

  const productList: any[] = [];
  for (const p of rawProducts) {
    const unitId = unitMap.get(p.u);
    const categoryId = categoryMap.get(p.cat);
    const brandId = brandMap.get(p.b);
    const sectionId = sectionMap.get(p.sec);

    if (!unitId || !categoryId) continue;

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + p.expDays);

    const product = await prisma.product.create({
      data: {
        name: p.name,
        nameEn: p.nameEn,
        barcode: p.barcode,
        sku: p.sku,
        description: `খুচরা ও পাইকারি বিক্রয়ের পণ্য। ${p.nameEn}`,
        purchasePrice: p.purchasePrice,
        sellingPrice: p.sellingPrice,
        wholesalePrice: p.wholesalePrice,
        vatPercent: p.vat,
        expiryDate,
        alertQuantity: p.alert,
        status: "active",
        unitId,
        categoryId,
        brandId,
        sectionId,
        shopId: shop.id,
      },
    });

    productList.push(product);

    // Stock for Main Branch
    await prisma.productStock.create({
      data: { productId: product.id, branchId: mainBranch.id, quantity: p.stockMain },
    });

    // Stock for Mirpur Branch
    await prisma.productStock.create({
      data: { productId: product.id, branchId: mirpurBranch.id, quantity: p.stockMirpur },
    });
  }

  // ==========================================
  // 5. SUPPLIERS & PURCHASES
  // ==========================================
  console.log("🚚 [5/12] Seeding FMCG Suppliers & Purchases...");
  const suppliersData = [
    { id: "supp-pran", name: "প্রাণ ফুডস ডিস্ট্রিবিউশন", company: "PRAN Foods Ltd", phone: "01711002233", due: 24500 },
    { id: "supp-unilever", name: "ইউনিলিভার বাংলাদেশ সাপ্লাই", company: "Unilever Bangladesh Ltd", phone: "01811445566", due: 45000 },
    { id: "supp-square", name: "স্কয়ার কনজিউমার সাপ্লায়ার", company: "Square Consumer Ltd", phone: "01911778899", due: 18000 },
    { id: "supp-fresh", name: "মেঘনা ফ্রেশ ডিপো", company: "Meghna Group", phone: "01722334455", due: 32000 },
    { id: "supp-akij", name: "আকিজ বেভারেজ সাপ্লাই", company: "Akij Food Ltd", phone: "01533445566", due: 12500 },
  ];

  const supplierMap = new Map();
  for (const s of suppliersData) {
    const supp = await prisma.supplier.create({
      data: {
        id: s.id,
        name: s.name,
        companyName: s.company,
        phone: s.phone,
        contactPerson: "SR Manager",
        address: "ঢাকা, বাংলাদেশ",
        openingDue: 0,
        currentDue: s.due,
        status: "active",
        shopId: shop.id,
        branchId: mainBranch.id,
      },
    });
    supplierMap.set(s.id, supp);
  }

  const chalans = [
    { no: "CH-PRAN-901", daysAgo: 25, sub: 45000, paid: 35000, due: 10000, supp: "supp-pran", status: "PARTIAL" },
    { no: "CH-UNI-902", daysAgo: 20, sub: 60000, paid: 60000, due: 0, supp: "supp-unilever", status: "PAID" },
    { no: "CH-SQR-903", daysAgo: 15, sub: 52000, paid: 40000, due: 12000, supp: "supp-square", status: "PARTIAL" },
    { no: "CH-FRSH-904", daysAgo: 10, sub: 78000, paid: 50000, due: 28000, supp: "supp-fresh", status: "PARTIAL" },
    { no: "CH-AKJ-905", daysAgo: 4, sub: 28000, paid: 28000, due: 0, supp: "supp-akij", status: "PAID" },
  ];

  for (const ch of chalans) {
    await prisma.purchase.create({
      data: {
        chalanNo: ch.no,
        purchaseDate: new Date(Date.now() - ch.daysAgo * 24 * 60 * 60 * 1000),
        subtotal: ch.sub,
        totalQuantity: 80,
        discount: 0,
        transportCost: 400,
        vatAmount: 0,
        grandTotal: ch.sub + 400,
        paidAmount: ch.paid,
        dueAmount: ch.due + 400,
        paymentMethod: "bank",
        paymentStatus: ch.status as any,
        branchId: mainBranch.id,
        supplierId: supplierMap.get(ch.supp)!.id,
        shopId: shop.id,
        items: {
          create: [
            {
              productId: productList[0].id,
              unitId: productList[0].unitId,
              quantity: 40,
              unitCost: productList[0].purchasePrice,
              lineTotal: 40 * productList[0].purchasePrice,
            },
            {
              productId: productList[3].id,
              unitId: productList[3].unitId,
              quantity: 10,
              unitCost: productList[3].purchasePrice,
              lineTotal: 10 * productList[3].purchasePrice,
            },
          ],
        },
      },
    });
  }

  // ==========================================
  // 6. CUSTOMERS (STRICT BRANCH ISOLATION)
  // ==========================================
  console.log("👤 [6/12] Seeding Customers with Strict Branch Ownership...");
  const customersData = [
    // Main Branch Customers
    { id: "cust-walkin-main", name: "নগদ ক্রেতা (Main Counter)", phone: "01500000000", type: "WALK_IN", due: 0, limit: 0, branchId: mainBranch.id },
    { id: "cust-tushi", name: "মোসাঃ তুশি আক্তার", phone: "01711998877", type: "PERMANENT", due: 10865, limit: 15000, branchId: mainBranch.id },
    { id: "cust-haji", name: "হাজী আবুল হোসেন (Aging Overdue)", phone: "01811889900", type: "PERMANENT", due: 22400, limit: 25000, branchId: mainBranch.id },
    { id: "cust-dr-kabir", name: "ডাঃ কবির আহমেদ", phone: "01722446688", type: "PERMANENT", due: 4500, limit: 20000, branchId: mainBranch.id },
    { id: "cust-master", name: "হেডমাস্টার শফিকুল ইসলাম", phone: "01833557799", type: "PERMANENT", due: 6800, limit: 10000, branchId: mainBranch.id },
    { id: "cust-anwar", name: "আনোয়ার হোসেন (হোটেল ব্যবসায়ী)", phone: "01944668800", type: "PERMANENT", due: 34500, limit: 50000, branchId: mainBranch.id },
    { id: "cust-babul", name: "মোঃ বাবুল মিয়া", phone: "01655779911", type: "PERMANENT", due: 1850, limit: 5000, branchId: mainBranch.id },

    // Mirpur Branch Customers
    { id: "cust-walkin-mirpur", name: "নগদ ক্রেতা (Mirpur Counter)", phone: "01500000011", type: "WALK_IN", due: 0, limit: 0, branchId: mirpurBranch.id },
    { id: "cust-nasima", name: "নাসিমা বেগম", phone: "01766880022", type: "PERMANENT", due: 5400, limit: 8000, branchId: mirpurBranch.id },
    { id: "cust-kamal", name: "মোঃ কামাল হোসেন", phone: "01855667788", type: "PERMANENT", due: 12000, limit: 15000, branchId: mirpurBranch.id },
  ];

  const customerMap = new Map();
  for (const c of customersData) {
    const cust = await prisma.customer.create({
      data: {
        id: c.id,
        name: c.name,
        phone: c.phone,
        type: c.type as any,
        village: "কাওরান বাজার",
        district: "ঢাকা",
        address: "বাসা নং ১২, রোড ৩",
        creditLimit: c.limit,
        openingDue: 0,
        currentDue: c.due,
        status: "active",
        shopId: shop.id,
        branchId: c.branchId,
      },
    });
    customerMap.set(c.id, cust);
  }

  // ==========================================
  // 7. 30-DAY CONTINUOUS POS SALES ENGINE
  // ==========================================
  console.log("📈 [7/12] Generating 30 Days of Continuous POS Sales for Recharts Graphs...");
  let invoiceCounter = 26000;
  const paymentMethods = ["cash", "cash", "cash", "bkash", "bkash", "nagad", "due"];
  const mainPermanentCustIds = ["cust-tushi", "cust-haji", "cust-dr-kabir", "cust-master", "cust-anwar", "cust-babul"];
  const mirpurPermanentCustIds = ["cust-nasima", "cust-kamal"];

  for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
    const invoicesToday = 3 + Math.floor((daysAgo * 7) % 4); 

    for (let i = 0; i < invoicesToday; i++) {
      invoiceCounter++;
      const invNo = `INV-${invoiceCounter}`;

      const hour = 9 + ((i * 3 + daysAgo) % 13);
      const minute = (i * 17) % 60;
      const saleTimestamp = new Date();
      saleTimestamp.setDate(saleTimestamp.getDate() - daysAgo);
      saleTimestamp.setHours(hour, minute, 0, 0);

      const method = paymentMethods[(daysAgo + i) % paymentMethods.length];
      const isDue = method === "due";

      // Distribute sales between Main and Mirpur
      const isMirpur = daysAgo % 4 === 0 && i === 0;
      const activeBranchId = isMirpur ? mirpurBranch.id : mainBranch.id;
      const activeCashierId = isMirpur ? mirpurCashierUser.id : cashierUser.id;

      let customerId: string;
      if (isDue) {
        if (isMirpur) {
          const custKey = mirpurPermanentCustIds[i % mirpurPermanentCustIds.length];
          customerId = customerMap.get(custKey)!.id;
        } else {
          const custKey = mainPermanentCustIds[(daysAgo + i) % mainPermanentCustIds.length];
          customerId = customerMap.get(custKey)!.id;
        }
      } else {
        customerId = isMirpur
          ? customerMap.get("cust-walkin-mirpur")!.id
          : customerMap.get("cust-walkin-main")!.id;
      }

      const numItems = 2 + (i % 3);
      const selectedProducts: any[] = [];
      for (let k = 0; k < numItems; k++) {
        const prodIndex = (daysAgo * 3 + i * 2 + k) % productList.length;
        selectedProducts.push(productList[prodIndex]);
      }

      let subtotal = 0;
      const lineItems = selectedProducts.map((p, idx) => {
        const qty = p.unitId === unitMap.get("kg") || p.unitId === unitMap.get("ltr") ? 1 + (idx % 3) : 1 + (idx % 4);
        const lineTotal = qty * p.sellingPrice;
        subtotal += lineTotal;
        return {
          productId: p.id,
          unitId: p.unitId,
          quantity: qty,
          unitPrice: p.sellingPrice,
          purchaseCost: p.purchasePrice,
          lineTotal,
        };
      });

      const discount = i % 5 === 0 ? 50 : 0;
      const grandTotal = Math.max(0, subtotal - discount);
      const paidAmount = isDue ? (i % 2 === 0 ? Math.floor(grandTotal * 0.3) : 0) : grandTotal;
      const dueAmount = grandTotal - paidAmount;
      const paymentStatus = dueAmount === 0 ? "paid" : paidAmount > 0 ? "partial" : "due";

      await prisma.sale.create({
        data: {
          invoiceNo: invNo,
          saleDate: saleTimestamp,
          createdAt: saleTimestamp,
          subtotal,
          discount,
          vatPercent: 0,
          vatAmount: 0,
          grandTotal,
          paidAmount,
          dueAmount,
          paymentMethod: method,
          paymentStatus,
          branchId: activeBranchId,
          customerId,
          userId: activeCashierId,
          shopId: shop.id,
          items: {
            create: lineItems,
          },
        },
      });
    }
  }
  console.log(`✅ Seeded ${invoiceCounter - 26000} historical POS invoices!`);

  // ==========================================
  // 8. FINANCIAL ACCOUNTS, CHEQUES & LOANS
  // ==========================================
  console.log("💳 [8/12] Seeding Financial Accounts, Cheques & Hawlat...");
  const accountsData = [
    { name: "প্রধান ক্যাশ ড্রয়ার (Main Cash Drawer)", type: "CASH" as const, opening: 15000, current: 28500, branchId: mainBranch.id },
    { name: "মিরপুর ক্যাশ ড্রয়ার (Mirpur Cash Drawer)", type: "CASH" as const, opening: 10000, current: 16400, branchId: mirpurBranch.id },
    { name: "ডাচ-বাংলা ব্যাংক লিঃ (DBBL Current)", type: "BANK" as const, accNo: "124.101.5940", opening: 150000, current: 215000, branchId: mainBranch.id },
    { name: "বিকাশ মার্চেন্ট ওয়ালেট (bKash)", type: "BKASH" as const, accNo: "01700000000", opening: 35000, current: 48950, branchId: mainBranch.id },
    { name: "নগদ মার্চেন্ট ওয়ালেট (Nagad)", type: "NAGAD" as const, accNo: "01800000000", opening: 15000, current: 21300, branchId: mainBranch.id },
  ];

  const accountMap = new Map();
  for (const acc of accountsData) {
    const account = await prisma.account.create({
      data: {
        name: acc.name,
        type: acc.type,
        accountNumber: acc.accNo,
        bankName: acc.type === "BANK" ? "Dutch-Bangla Bank Ltd" : undefined,
        openingBalance: acc.opening,
        currentBalance: acc.current,
        status: "active",
        branchId: acc.branchId,
        shopId: shop.id,
      },
    });
    accountMap.set(acc.name, account.id);
  }

  await prisma.bankCheque.createMany({
    data: [
      {
        type: "RECEIVED",
        partyType: "CUSTOMER",
        partyName: "আমিনুল ইসলাম (হোলসেল)",
        bankName: "City Bank Ltd",
        chequeNumber: "CHQ-88412",
        chequeDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        amount: 35000,
        status: "PENDING",
        branchId: mainBranch.id,
        shopId: shop.id,
      },
      {
        type: "ISSUED",
        partyType: "SUPPLIER",
        partyName: "Unilever Bangladesh Ltd",
        bankName: "Dutch-Bangla Bank",
        chequeNumber: "CHQ-10924",
        chequeDate: new Date(),
        amount: 45000,
        status: "PENDING",
        branchId: mainBranch.id,
        shopId: shop.id,
      },
    ],
  });

  const mainCashId = accountMap.get("প্রধান ক্যাশ ড্রয়ার (Main Cash Drawer)");
  const dbblId = accountMap.get("ডাচ-বাংলা ব্যাংক লিঃ (DBBL Current)");

  await prisma.loan.createMany({
    data: [
      {
        type: "TAKEN",
        personName: "হাজি আবুল কাসেম (চাচা)",
        phone: "01811223344",
        amount: 100000,
        totalPaid: 30000,
        remainingAmount: 70000,
        loanDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        status: "ACTIVE",
        notes: "দোকানের মালামাল স্টক বৃদ্ধির জন্য ধার গ্রহণ",
        accountId: dbblId,
        branchId: mainBranch.id,
        shopId: shop.id,
      },
      {
        type: "GIVEN",
        personName: "রফিকুল ইসলাম (হেড ক্যাশিয়ার)",
        phone: "01911223344",
        amount: 10000,
        totalPaid: 4000,
        remainingAmount: 6000,
        loanDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        status: "ACTIVE",
        notes: "পারিবারিক চিকিৎসার জন্য জরুরি হাওলাত",
        accountId: mainCashId,
        branchId: mainBranch.id,
        shopId: shop.id,
      },
    ],
  });

  // ==========================================
  // 9. EXPENSES, INCOMES & ASSETS
  // ==========================================
  console.log("📉 [9/12] Seeding Recurring OPEX & Assets...");
  const expenseCatsData = [
    { name: "দোকান ভাড়া (Shop Rent)", code: "EXP-RENT" },
    { name: "বিদ্যুৎ বিল (Electricity Bill)", code: "EXP-ELEC" },
    { name: "স্টাফ খাবার ও চা-নাস্তা (Staff Food)", code: "EXP-FOOD" },
    { name: "পরিবহন ও লেবার (Transport & Labor)", code: "EXP-TRANS" },
    { name: "মেরামত ও রক্ষণাবেক্ষণ (Maintenance)", code: "EXP-MAINT" },
  ];

  const expenseCatMap = new Map();
  for (const ec of expenseCatsData) {
    const cat = await prisma.expenseCategory.create({
      data: { name: ec.name, code: ec.code, status: "active", shopId: shop.id },
    });
    expenseCatMap.set(ec.code, cat.id);
  }

  const expensesToSeed: any[] = [];
  for (let d = 28; d >= 0; d -= 2) {
    const expDate = new Date();
    expDate.setDate(expDate.getDate() - d);

    expensesToSeed.push({
      voucherNo: `VCH-TEA-${100 + d}`,
      expenseDate: expDate,
      amount: 250 + (d % 3) * 60,
      paymentMethod: "cash",
      reference: "Daily Staff Tea & Snacks",
      note: "কর্মচারীদের নাস্তা বিল",
      categoryId: expenseCatMap.get("EXP-FOOD")!,
      branchId: mainBranch.id,
      shopId: shop.id,
    });

    if (d % 6 === 0) {
      expensesToSeed.push({
        voucherNo: `VCH-TRN-${200 + d}`,
        expenseDate: expDate,
        amount: 600 + (d % 2) * 200,
        paymentMethod: "cash",
        reference: "Goods Unloading Van & Labor",
        note: "ট্রাক থেকে মাল খালাস কুলি ভাড়া",
        categoryId: expenseCatMap.get("EXP-TRANS")!,
        branchId: mainBranch.id,
        shopId: shop.id,
      });
    }
  }

  expensesToSeed.push(
    {
      voucherNo: "VCH-RENT-OCT",
      expenseDate: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000),
      amount: 25000,
      paymentMethod: "bank",
      reference: "Main Branch Monthly Shop Rent",
      note: "কাওরান বাজার দোকান ভাড়া",
      categoryId: expenseCatMap.get("EXP-RENT")!,
      branchId: mainBranch.id,
      shopId: shop.id,
    },
    {
      voucherNo: "VCH-ELEC-OCT",
      expenseDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      amount: 6800,
      paymentMethod: "bank",
      reference: "DESCO Electricity Prepaid Recharge",
      note: "বিদ্যুৎ বিল অক্টোবর ২০২৬",
      categoryId: expenseCatMap.get("EXP-ELEC")!,
      branchId: mainBranch.id,
      shopId: shop.id,
    }
  );

  await prisma.expense.createMany({ data: expensesToSeed });

  await prisma.companyAsset.createMany({
    data: [
      {
        name: "ওয়ালটন বেভারেজ কুলার ফ্রিজ ৪০০ লিটার",
        assetCode: "AST-FRZ-01",
        serialNumber: "WLT-99482",
        purchaseDate: new Date("2025-01-15"),
        purchaseCost: 52000,
        currentValue: 46000,
        condition: "GOOD",
        notes: "প্রধান শাখা ডিসপ্লে ফ্রিজ",
        branchId: mainBranch.id,
        shopId: shop.id,
      },
      {
        name: "ডিজিটাল ওজন স্কেল ৪০ কেজি",
        assetCode: "AST-SCL-01",
        serialNumber: "SCL-40KG-01",
        purchaseDate: new Date("2025-03-20"),
        purchaseCost: 6500,
        currentValue: 5500,
        condition: "GOOD",
        notes: "কাউন্টার স্কেল",
        branchId: mainBranch.id,
        shopId: shop.id,
      },
    ],
  });

  // ==========================================
  // 10. STAFF & DEPARTMENTS
  // ==========================================
  console.log("👨‍💼 [10/12] Seeding Full Staff Roster & Departments...");
  const depts = [
    { name: "বিক্রয় ও ক্যাশ কাউন্টার (Sales & POS)", code: "SALES" },
    { name: "স্টোর ও গুদাম নিয়ন্ত্রণ (Inventory & Stock)", code: "WH" },
    { name: "হিসাব ও অর্থায়ন (Accounts)", code: "ACC" },
  ];

  const deptMap = new Map();
  for (const d of depts) {
    const dept = await prisma.department.create({
      data: { name: d.name, code: d.code, description: d.name, status: "active", shopId: shop.id },
    });
    deptMap.set(d.code, dept.id);
  }

  const staffProfiles = [
    { name: "মোঃ রফিকুল ইসলাম", phone: "01711334455", desig: "Senior Cashier", basic: 18000, dept: "SALES", branch: mainBranch.id },
    { name: "কাজী ফারুক", phone: "01811445566", desig: "Store Manager", basic: 24000, dept: "ACC", branch: mainBranch.id },
    { name: "আল-আমিন মোল্লা", phone: "01911556677", desig: "Inventory Keeper", basic: 14000, dept: "WH", branch: mainBranch.id },
    { name: "সুমন হোসেন", phone: "01611667788", desig: "Mirpur Cashier", basic: 16000, dept: "SALES", branch: mirpurBranch.id },
  ];

  for (const st of staffProfiles) {
    await prisma.staffProfile.create({
      data: {
        name: st.name,
        phone: st.phone,
        designation: st.desig,
        joiningDate: new Date("2024-02-01"),
        basicSalary: st.basic,
        dailyAllowance: 100,
        overtimeRate: 60,
        address: "ঢাকা, বাংলাদেশ",
        status: "ACTIVE",
        departmentId: deptMap.get(st.dept)!,
        branchId: st.branch,
        shopId: shop.id,
      },
    });
  }

  // ==========================================
  // 11. DAY-END Z-REPORT REGISTERS (7 DAYS)
  // ==========================================
  console.log("🔒 [11/12] Seeding 7 Days of Day-End Z-Closings...");
  for (let day = 7; day >= 1; day--) {
    const closingDate = new Date();
    closingDate.setDate(closingDate.getDate() - day);

    const cashSales = 28000 + day * 1800;
    const cashDueCollected = 3500 + day * 400;
    const cashExpenses = 1200 + (day % 3) * 350;
    const cashSupplierPaid = day % 2 === 0 ? 12000 : 0;
    const openingCash = 12000;

    const expected = openingCash + cashSales + cashDueCollected - cashExpenses - cashSupplierPaid;
    const diff = day === 2 ? -50 : day === 4 ? 30 : 0;
    const counted = expected + diff;

    await prisma.cashRegister.create({
      data: {
        closingDate,
        openingTime: "08:30:00",
        closingTime: "22:45:00",
        openingCash,
        cashSales,
        cashDueCollected,
        cashOtherIncome: 0,
        cashExpenses,
        cashSupplierPaid,
        cashRefunds: 0,
        expectedCash: expected,
        countedCash: counted,
        difference: diff,
        totalInvoices: 32 + day * 3,
        notes: diff === 0 ? "দিনশেষে হিসাব নিখুঁতভাবে মিলেছে।" : `ক্যাশ ড্রয়ারে ${diff} টাকার অমিল পরিলক্ষিত হয়েছে।`,
        status: "closed",
        branchId: mainBranch.id,
        userId: cashierUser.id,
        shopId: shop.id,
      },
    });
  }

  // ==========================================
  // 12. FAMILY BUSINESS LEDGER & DRAWINGS
  // ==========================================
  console.log("👨‍👩‍👧‍👦 [12/12] Seeding Family Stakeholders (Father, 2 Uncles, 2 Brothers, Self)...");

  const familyPartners = [
    { name: "হাজী মোহাম্মদ সেলিম (বাবা)", rel: "FATHER" as const, equity: 40.0, cap: 1500000, allow: 30000 },
    { name: "হাজী আব্দুল করিম (বড় চাচা)", rel: "UNCLE" as const, equity: 25.0, cap: 1000000, allow: 25000 },
    { name: "হাজী নুরুল ইসলাম (ছোট চাচা)", rel: "UNCLE" as const, equity: 20.0, cap: 800000, allow: 20000 },
    { name: "তারিকুল সেলিম (বড় ভাই)", rel: "BROTHER" as const, equity: 5.0, cap: 250000, allow: 15000 },
    { name: "ফারহান সেলিম (ছোট ভাই)", rel: "BROTHER" as const, equity: 5.0, cap: 250000, allow: 15000 },
    { name: "মোঃ আরিফুল ইসলাম (নিজে)", rel: "SELF" as const, equity: 5.0, cap: 200000, allow: 15000 },
  ];

  const partnerMap = new Map();
  for (const fp of familyPartners) {
    const p = await prisma.partner.create({
      data: {
        name: fp.name,
        relationship: fp.rel,
        equityPercent: fp.equity,
        openingCapital: fp.cap,
        currentBalance: fp.cap,
        monthlyAllowance: fp.allow,
        shopId: shop.id,
      },
    });
    partnerMap.set(fp.rel, p);
  }

  const father = partnerMap.get("FATHER");
  const uncle1 = partnerMap.get("UNCLE");

  if (father && uncle1 && mainCashId) {
    await prisma.partnerTransaction.createMany({
      data: [
        {
          voucherNo: "VCH-DRW-501",
          type: "CASH_DRAWING",
          amount: 15000,
          transactionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          purpose: "বাবার পারিবারিক মাসিক হাতখরচ",
          paymentMethod: "cash",
          partnerId: father.id,
          accountId: mainCashId,
          branchId: mainBranch.id,
          shopId: shop.id,
        },
        {
          voucherNo: "VCH-DRW-502",
          type: "HOUSEHOLD_EXPENSE",
          amount: 8500,
          transactionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          purpose: "বড় চাচার বাচ্চার সেমিস্টার ফি",
          paymentMethod: "cash",
          partnerId: uncle1.id,
          accountId: mainCashId,
          branchId: mainBranch.id,
          shopId: shop.id,
        },
      ],
    });
  }

  console.log("============================================================");
  console.log("🎉 SUCCESS: Master Seed Completed with High-Volume Data!");
  console.log("============================================================");
  console.log("🏢 Outlets:          2 Outlets (Main + Mirpur-10 Branch)");
  console.log("📦 Products:         32 Items with Real Barcodes & Branch Stock");
  console.log("💰 Sales History:    30 Days of Consecutive POS Invoices");
  console.log("👥 Customer Khata:   10 Customers (Strict Branch Scoped)");
  console.log("👨‍👩‍👧‍👦 Family Ledger:   6 Partners (Father, Uncles, Brothers, Self)");
  console.log("🚚 Suppliers:        5 FMCG Vendors with Active Payables");
  console.log("🔒 Day-End Closings: 7 Consecutive Cash Register Z-Reports");
  console.log("------------------------------------------------------------");
  console.log("🔑 Demo Login Credentials (All Passwords: 123456):");
  console.log("   👑 OWNER:          owner@grocery.com");
  console.log("   👔 MAIN MANAGER:   manager@grocery.com");
  console.log("   🧑‍💻 MAIN CASHIER:   cashier@grocery.com");
  console.log("   👔 MIRPUR MANAGER: manager.mirpur@grocery.com");
  console.log("   🧑‍💻 MIRPUR CASHIER: cashier.mirpur@grocery.com");
  console.log("============================================================");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });