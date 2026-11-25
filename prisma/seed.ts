import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import dotenv from "dotenv";
import type { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";

// Works both via `prisma db seed` and `tsx prisma/seed.ts` directly.
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

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

type SeedUserRole = "OWNER" | "MANAGER" | "CASHIER";
type SeedCustomerType = "WALK_IN" | "PERMANENT";
type SeedPaymentStatus = "PAID" | "PARTIAL" | "DUE";

// Demo credentials: never ship a known password. Provide SEED_PASSWORD (>=12 chars)
// or one strong random password is generated and printed once at the end.
const ENV_SEED_PASSWORD = process.env.SEED_PASSWORD?.trim();
const GENERATED_SEED_PASSWORD = ENV_SEED_PASSWORD
  ? null
  : `${randomBytes(18).toString("base64url")}Aa1`;
const SEED_PASSWORD = ENV_SEED_PASSWORD || GENERATED_SEED_PASSWORD!;

if (SEED_PASSWORD.length < 12) {
  throw new Error("SEED_PASSWORD must be at least 12 characters long.");
}

interface SeedProduct {
  id: string;
  unitId: string;
  purchasePrice: number;
  sellingPrice: number;
}

async function cleanDatabase() {
  console.log("🧹 [0/12] Cleaning previous database records...");

  // FOREIGN_KEY_CHECKS is session-scoped, so all work must stay on one
  // connection. A transaction guarantees that; enumerating the tables also
  // keeps this correct as new models are added.
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0;`);
    try {
      const tables = await tx.$queryRawUnsafe<{ tableName: string }[]>(
        `SELECT TABLE_NAME AS tableName
         FROM information_schema.tables
         WHERE table_schema = DATABASE()
           AND table_type = 'BASE TABLE'
           AND TABLE_NAME <> '_prisma_migrations'`
      );

      for (const { tableName } of tables) {
        if (!/^[A-Za-z0-9_]+$/.test(tableName)) continue;
        await tx.$executeRawUnsafe(`DELETE FROM \`${tableName}\``);
      }
    } finally {
      await tx.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1;`);
    }
  });

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
  const hashedPassword = await bcrypt.hash(SEED_PASSWORD, 10);

  const users: Array<{
    email: string;
    name: string;
    role: SeedUserRole;
    branchId: string;
    phone: string;
  }> = [
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
        role: u.role,
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
  // 4. RICH PRODUCT CATALOG (72 ITEMS)
  // ==========================================
  console.log("🛒 [4/12] Seeding 72 Products with Expiry & Multi-Branch Stock...");
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

  const productList: SeedProduct[] = [];
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
        sellingPrice: Math.round(p.sellingPrice * 1.2),
        wholesalePrice: Math.round(p.wholesalePrice * 1.2),
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

    productList.push({
      id: product.id,
      unitId: product.unitId,
      purchasePrice: Number(product.purchasePrice),
      sellingPrice: Number(product.sellingPrice),
    });

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
  // 4b. EXTENDED CATALOG (adds test depth)
  // ==========================================
  interface ExtraProduct {
    name: string;
    nameEn: string;
    u: string;
    cat: string;
    b: string;
    sec: string;
    cost: number;
    sell: number;
    vat: number;
    expDays: number;
    alert: number;
    main: number;
    mirpur: number;
  }

  const extraProducts: ExtraProduct[] = [
    { name: "ফ্রেশ মিল্ক পাউডার ১ কেজি", nameEn: "Fresh Milk Powder 1kg", u: "pkt", cat: "dairy-milk", b: "Pran Foods", sec: "SH-01", cost: 650, sell: 720, vat: 0, expDays: 365, alert: 10, main: 40, mirpur: 20 },
    { name: "আড়ং মাখন ২০০ গ্রাম", nameEn: "Aarong Butter 200g", u: "pcs", cat: "dairy-milk", b: "Pran Foods", sec: "RK-A", cost: 260, sell: 295, vat: 0, expDays: 120, alert: 8, main: 25, mirpur: 12 },
    { name: "পোলো ক্যান্ডি ২০ পিস", nameEn: "Polo Candy 20pcs", u: "pkt", cat: "snacks-biscuits", b: "Pran Foods", sec: "SH-02", cost: 100, sell: 120, vat: 0, expDays: 240, alert: 15, main: 60, mirpur: 30 },
    { name: "প্রাণ চানাচুর ৫০০ গ্রাম", nameEn: "Pran Chanachur 500g", u: "pkt", cat: "snacks-biscuits", b: "Pran Foods", sec: "SH-02", cost: 90, sell: 110, vat: 0, expDays: 150, alert: 12, main: 55, mirpur: 25 },
    { name: "লেইজ চিপস ২৫ গ্রাম", nameEn: "Lays Chips 25g", u: "pcs", cat: "snacks-biscuits", b: "Akij Food", sec: "SH-02", cost: 20, sell: 25, vat: 0, expDays: 120, alert: 30, main: 120, mirpur: 60 },
    { name: "পেপসি ৫০০ মিলি", nameEn: "Pepsi 500ml", u: "pcs", cat: "beverages", b: "Akij Food", sec: "RK-A", cost: 32, sell: 40, vat: 5, expDays: 180, alert: 24, main: 100, mirpur: 50 },
    { name: "সেভেন আপ ১ লিটার", nameEn: "7UP 1L", u: "pcs", cat: "beverages", b: "Akij Food", sec: "RK-A", cost: 60, sell: 72, vat: 5, expDays: 180, alert: 20, main: 70, mirpur: 35 },
    { name: "ফ্রুটিকা জুস ১ লিটার", nameEn: "Frutika Juice 1L", u: "pcs", cat: "beverages", b: "Pran Foods", sec: "RK-A", cost: 120, sell: 140, vat: 0, expDays: 120, alert: 15, main: 45, mirpur: 20 },
    { name: "নেসলে ওয়াটার ১ লিটার", nameEn: "Nestle Water 1L", u: "pcs", cat: "beverages", b: "Nestlé", sec: "RK-A", cost: 20, sell: 25, vat: 0, expDays: 365, alert: 30, main: 140, mirpur: 70 },
    { name: "বাসমতি চাল ৫ কেজি", nameEn: "Basmati Rice 5kg", u: "bag", cat: "rice-grains", b: "Meghna (Fresh)", sec: "ST-01", cost: 950, sell: 1080, vat: 0, expDays: 365, alert: 6, main: 25, mirpur: 12 },
    { name: "চিনিগুঁড়া চাল ২ কেজি", nameEn: "Chinigura Rice 2kg", u: "pkt", cat: "rice-grains", b: "Meghna (Fresh)", sec: "ST-01", cost: 320, sell: 365, vat: 0, expDays: 365, alert: 10, main: 35, mirpur: 18 },
    { name: "মুগ ডাল ১ কেজি", nameEn: "Mung Dal 1kg", u: "kg", cat: "rice-grains", b: "Pran Foods", sec: "ST-01", cost: 150, sell: 175, vat: 0, expDays: 240, alert: 15, main: 50, mirpur: 25 },
    { name: "ছোলা ১ কেজি", nameEn: "Chickpea 1kg", u: "kg", cat: "rice-grains", b: "Meghna (Fresh)", sec: "ST-01", cost: 110, sell: 130, vat: 0, expDays: 240, alert: 15, main: 45, mirpur: 20 },
    { name: "ফ্রেশ আটা ৫ কেজি", nameEn: "Fresh Atta 5kg", u: "bag", cat: "rice-grains", b: "Meghna (Fresh)", sec: "ST-01", cost: 250, sell: 285, vat: 0, expDays: 180, alert: 10, main: 40, mirpur: 20 },
    { name: "ফ্রেশ সয়াবিন তেল ১ লিটার", nameEn: "Fresh Soybean Oil 1L", u: "ltr", cat: "cooking-essentials", b: "Meghna (Fresh)", sec: "SH-01", cost: 165, sell: 185, vat: 0, expDays: 270, alert: 20, main: 60, mirpur: 30 },
    { name: "স্কয়ার সরিষার তেল ১ লিটার", nameEn: "Square Mustard Oil 1L", u: "ltr", cat: "cooking-essentials", b: "Square", sec: "SH-01", cost: 300, sell: 340, vat: 0, expDays: 270, alert: 10, main: 30, mirpur: 15 },
    { name: "স্কয়ার জিরা গুঁড়া ১০০ গ্রাম", nameEn: "Square Cumin Powder 100g", u: "pkt", cat: "cooking-essentials", b: "Square", sec: "SH-01", cost: 80, sell: 95, vat: 0, expDays: 300, alert: 12, main: 45, mirpur: 20 },
    { name: "স্কয়ার ধনিয়া গুঁড়া ২০০ গ্রাম", nameEn: "Square Coriander Powder 200g", u: "pkt", cat: "cooking-essentials", b: "Square", sec: "SH-01", cost: 70, sell: 85, vat: 0, expDays: 300, alert: 12, main: 40, mirpur: 18 },
    { name: "স্কয়ার গরম মসলা ৫০ গ্রাম", nameEn: "Square Garam Masala 50g", u: "pkt", cat: "cooking-essentials", b: "Square", sec: "SH-01", cost: 55, sell: 68, vat: 0, expDays: 300, alert: 15, main: 50, mirpur: 25 },
    { name: "মেঘনা লবণ ২ কেজি", nameEn: "Meghna Salt 2kg", u: "pkt", cat: "cooking-essentials", b: "Meghna (Fresh)", sec: "SH-01", cost: 55, sell: 65, vat: 0, expDays: 500, alert: 24, main: 90, mirpur: 45 },
    { name: "ফ্রেশ চিনি ২ কেজি", nameEn: "Fresh Sugar 2kg", u: "pkt", cat: "cooking-essentials", b: "Meghna (Fresh)", sec: "SH-01", cost: 240, sell: 260, vat: 0, expDays: 400, alert: 15, main: 55, mirpur: 25 },
    { name: "ইস্পাহানি চা পাতা ৪০০ গ্রাম", nameEn: "Ispahani Tea 400g", u: "pkt", cat: "beverages", b: "Meghna (Fresh)", sec: "RK-A", cost: 220, sell: 250, vat: 5, expDays: 300, alert: 12, main: 40, mirpur: 18 },
    { name: "নেসলে কফি ১০০ গ্রাম", nameEn: "Nescafe Coffee 100g", u: "pcs", cat: "beverages", b: "Nestlé", sec: "RK-A", cost: 480, sell: 540, vat: 5, expDays: 365, alert: 8, main: 24, mirpur: 12 },
    { name: "হুইল ডিটারজেন্ট ২ কেজি", nameEn: "Wheel Detergent 2kg", u: "pkt", cat: "cleaning-hygiene", b: "Unilever", sec: "CLN-01", cost: 240, sell: 270, vat: 5, expDays: 500, alert: 12, main: 40, mirpur: 20 },
    { name: "স্কয়ার ফ্লোর ক্লিনার ১ লিটার", nameEn: "Square Floor Cleaner 1L", u: "pcs", cat: "cleaning-hygiene", b: "Square", sec: "CLN-01", cost: 140, sell: 160, vat: 5, expDays: 400, alert: 10, main: 30, mirpur: 15 },
    { name: "ক্লিন অ্যান্ড ক্লিয়ার গ্লাস ক্লিনার", nameEn: "Clean & Clear Glass Cleaner", u: "pcs", cat: "cleaning-hygiene", b: "Unilever", sec: "CLN-01", cost: 120, sell: 140, vat: 5, expDays: 400, alert: 10, main: 28, mirpur: 14 },
    { name: "ক্লোজআপ টুথপেস্ট ১৫০ গ্রাম", nameEn: "Closeup Toothpaste 150g", u: "pcs", cat: "personal-care", b: "Unilever", sec: "CS-01", cost: 130, sell: 150, vat: 7.5, expDays: 365, alert: 12, main: 35, mirpur: 18 },
    { name: "গার্নিয়ার ফেসওয়াশ ১০০ গ্রাম", nameEn: "Garnier Face Wash 100g", u: "pcs", cat: "personal-care", b: "Unilever", sec: "CS-01", cost: 180, sell: 210, vat: 7.5, expDays: 400, alert: 8, main: 25, mirpur: 12 },
    { name: "ডেটল হ্যান্ডওয়াশ ২৫০ মিলি", nameEn: "Dettol Handwash 250ml", u: "pcs", cat: "personal-care", b: "Unilever", sec: "CS-01", cost: 120, sell: 140, vat: 5, expDays: 400, alert: 12, main: 32, mirpur: 16 },
    { name: "টুইঙ্কল বেবি সোপ ৭৫ গ্রাম", nameEn: "Twinkle Baby Soap 75g", u: "pcs", cat: "baby-care", b: "Square", sec: "CS-01", cost: 60, sell: 72, vat: 5, expDays: 400, alert: 15, main: 45, mirpur: 20 },
    { name: "স্কয়ার বেবি লোশন ২০০ মিলি", nameEn: "Square Baby Lotion 200ml", u: "pcs", cat: "baby-care", b: "Square", sec: "CS-01", cost: 220, sell: 250, vat: 5, expDays: 400, alert: 8, main: 22, mirpur: 10 },
    { name: "টুইঙ্কল বেবি ওয়াইপস ৮০ পিস", nameEn: "Twinkle Baby Wipes 80pcs", u: "pkt", cat: "baby-care", b: "Square", sec: "ST-01", cost: 180, sell: 210, vat: 5, expDays: 300, alert: 10, main: 28, mirpur: 12 },
    { name: "স্টিং এনার্জি ড্রিংক ২৫০ মিলি", nameEn: "Sting Energy Drink 250ml", u: "pcs", cat: "beverages", b: "Pran Foods", sec: "RK-A", cost: 70, sell: 85, vat: 5, expDays: 180, alert: 24, main: 80, mirpur: 40 },
    { name: "প্রাণ ম্যাংগো জুস ১ লিটার", nameEn: "Pran Mango Juice 1L", u: "pcs", cat: "beverages", b: "Pran Foods", sec: "RK-A", cost: 110, sell: 130, vat: 0, expDays: 120, alert: 15, main: 40, mirpur: 20 },
    { name: "প্রাণ লিচু জুস ২৫০ মিলি", nameEn: "Pran Litchi Juice 250ml", u: "pcs", cat: "beverages", b: "Pran Foods", sec: "RK-A", cost: 30, sell: 38, vat: 0, expDays: 120, alert: 24, main: 70, mirpur: 35 },
    { name: "অলিম্পিক ফ্যামিলি বিস্কুট", nameEn: "Olympic Family Biscuit", u: "pkt", cat: "snacks-biscuits", b: "Akij Food", sec: "SH-02", cost: 60, sell: 72, vat: 0, expDays: 180, alert: 18, main: 50, mirpur: 25 },
    { name: "নেসলে চকলেট বার ৫০ গ্রাম", nameEn: "Nestle Chocolate Bar 50g", u: "pcs", cat: "snacks-biscuits", b: "Nestlé", sec: "SH-02", cost: 45, sell: 55, vat: 0, expDays: 240, alert: 20, main: 60, mirpur: 30 },
    { name: "প্রাণ কেক স্লাইস ২৫০ গ্রাম", nameEn: "Pran Cake Slice 250g", u: "pcs", cat: "snacks-biscuits", b: "Pran Foods", sec: "SH-02", cost: 80, sell: 95, vat: 0, expDays: 30, alert: 10, main: 30, mirpur: 15 },
    { name: "প্যারাসুট হেয়ার অয়েল ১০০ মিলি", nameEn: "Parachute Hair Oil 100ml", u: "pcs", cat: "personal-care", b: "Unilever", sec: "CS-01", cost: 130, sell: 150, vat: 7.5, expDays: 500, alert: 10, main: 30, mirpur: 15 },
    { name: "জিলেট শেভিং ক্রিম ১০০ গ্রাম", nameEn: "Gillette Shaving Cream 100g", u: "pcs", cat: "personal-care", b: "Unilever", sec: "CS-01", cost: 150, sell: 175, vat: 7.5, expDays: 400, alert: 8, main: 22, mirpur: 10 },
  ];

  for (const [index, p] of extraProducts.entries()) {
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
        barcode: `8901001${String(200 + index).padStart(6, "0")}`,
        sku: `EXT-${String(index + 1).padStart(3, "0")}`,
        description: `বিস্তারিত টেস্ট ক্যাটালগ পণ্য। ${p.nameEn}`,
        purchasePrice: p.cost,
        sellingPrice: Math.round(p.sell * 1.2),
        wholesalePrice: Math.round(p.sell * 1.2 * 0.94),
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

    productList.push({
      id: product.id,
      unitId: product.unitId,
      purchasePrice: Number(product.purchasePrice),
      sellingPrice: Number(product.sellingPrice),
    });

    await prisma.productStock.createMany({
      data: [
        { productId: product.id, branchId: mainBranch.id, quantity: p.main },
        { productId: product.id, branchId: mirpurBranch.id, quantity: p.mirpur },
      ],
    });
  }

  // ==========================================
  // 5. SUPPLIERS & PURCHASES
  // ==========================================
  console.log("🚚 [5/12] Seeding FMCG Suppliers & Purchases...");
  const suppliersData = [
    { id: "supp-pran", name: "প্রাণ ফুডস ডিস্ট্রিবিউশন", company: "PRAN Foods Ltd", phone: "01711002233" },
    { id: "supp-unilever", name: "ইউনিলিভার বাংলাদেশ সাপ্লাই", company: "Unilever Bangladesh Ltd", phone: "01811445566" },
    { id: "supp-square", name: "স্কয়ার কনজিউমার সাপ্লায়ার", company: "Square Consumer Ltd", phone: "01911778899" },
    { id: "supp-fresh", name: "মেঘনা ফ্রেশ ডিপো", company: "Meghna Group", phone: "01722334455" },
    { id: "supp-akij", name: "আকিজ বেভারেজ সাপ্লাই", company: "Akij Food Ltd", phone: "01533445566" },
    { id: "supp-nestle", name: "নেসলে বাংলাদেশ ডিস্ট্রিবিউশন", company: "Nestlé Bangladesh", phone: "01733445577" },
    { id: "supp-molla", name: "মোল্লা সল্ট ইন্ডাস্ট্রিজ", company: "Molla Salt Ltd", phone: "01844556688" },
    { id: "supp-aci", name: "এসিআই ফুডস ডিপো", company: "ACI Foods Ltd", phone: "01955667799" },
    { id: "supp-ahmed", name: "আহমেদ ফুড প্রোডাক্টস", company: "Ahmed Foods", phone: "01666778800" },
    { id: "supp-kazi", name: "কাজী ফার্মস ডিস্ট্রিবিউশন", company: "Kazi Farms", phone: "01777889911" },
    { id: "supp-radhuni", name: "রাধুনী স্পাইস ডিপো", company: "Square Food & Beverage", phone: "01888990022" },
    { id: "supp-meghna-fresh", name: "ফ্রেশ চাল ও আটা ডিপো", company: "Meghna Fresh", phone: "01999001133" },
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
        currentDue: 0,
        status: "active",
        shopId: shop.id,
        branchId: mainBranch.id,
      },
    });
    supplierMap.set(s.id, supp);
  }

  const chalans: Array<{
    no: string;
    daysAgo: number;
    sub: number;
    paid: number;
    due: number;
    supp: string;
    status: SeedPaymentStatus;
  }> = [
    { no: "CH-PRAN-901", daysAgo: 25, sub: 45000, paid: 35000, due: 10000, supp: "supp-pran", status: "PARTIAL" },
    { no: "CH-UNI-902", daysAgo: 20, sub: 60000, paid: 60000, due: 0, supp: "supp-unilever", status: "PAID" },
    { no: "CH-SQR-903", daysAgo: 15, sub: 52000, paid: 40000, due: 12000, supp: "supp-square", status: "PARTIAL" },
    { no: "CH-FRSH-904", daysAgo: 10, sub: 78000, paid: 50000, due: 28000, supp: "supp-fresh", status: "PARTIAL" },
    { no: "CH-AKJ-905", daysAgo: 4, sub: 28000, paid: 28000, due: 0, supp: "supp-akij", status: "PAID" },
  ];

  interface SeedPurchaseRecord {
    id: string;
    supplierId: string;
    purchaseDate: Date;
    paid: number;
    due: number;
    paymentMethod: string;
  }
  const purchaseRecords: SeedPurchaseRecord[] = [];

  for (const ch of chalans) {
    const purchaseDate = new Date(Date.now() - ch.daysAgo * 24 * 60 * 60 * 1000);
    const purchase = await prisma.purchase.create({
      data: {
        id: `pur-${ch.no}`,
        chalanNo: ch.no,
        purchaseDate,
        subtotal: ch.sub,
        totalQuantity: 80,
        discount: 0,
        transportCost: 400,
        vatAmount: 0,
        grandTotal: ch.sub + 400,
        paidAmount: ch.paid,
        dueAmount: ch.due + 400,
        paymentMethod: "bank",
        paymentStatus: ch.status,
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
    purchaseRecords.push({
      id: purchase.id,
      supplierId: purchase.supplierId,
      purchaseDate,
      paid: ch.paid,
      due: ch.due + 400,
      paymentMethod: "bank",
    });
  }

  // Full-year purchase history (3 chalans per month)
  const purchaseStart = new Date();
  purchaseStart.setHours(10, 0, 0, 0);
  purchaseStart.setDate(purchaseStart.getDate() - 364);

  for (let month = 0; month < 12; month++) {
    for (let j = 0; j < 3; j++) {
      const purchaseDate = new Date(purchaseStart);
      purchaseDate.setMonth(purchaseDate.getMonth() + month);
      purchaseDate.setDate(4 + j * 9);
      if (purchaseDate > new Date()) continue;

      const supplier = suppliersData[(month * 3 + j) % suppliersData.length];
      const branch = j === 2 && month % 2 === 0 ? mirpurBranch : mainBranch;
      const method = ["cash", "bank", "bkash", "nagad"][(month + j) % 4];

      const items: {
        productId: string;
        unitId: string;
        quantity: number;
        unitCost: number;
        lineTotal: number;
      }[] = [];
      let subtotal = 0;
      let totalQuantity = 0;
      const lineCount = 3 + (j % 3);

      for (let k = 0; k < lineCount; k++) {
        const product = productList[(month * 5 + j * 7 + k) % productList.length];
        const quantity = 6 + ((month * 3 + j * 5 + k) % 18);
        const lineTotal = quantity * product.purchasePrice;
        subtotal += lineTotal;
        totalQuantity += quantity;
        items.push({
          productId: product.id,
          unitId: product.unitId,
          quantity,
          unitCost: product.purchasePrice,
          lineTotal,
        });
      }

      const transportCost = 300 + (month % 4) * 100;
      const grandTotal = subtotal + transportCost;
      const paid = j === 0 ? grandTotal : Math.round(grandTotal * (0.35 + (month % 4) * 0.1));
      const due = Math.max(0, grandTotal - paid);
      const paymentStatus = due === 0 ? "PAID" : paid > 0 ? "PARTIAL" : "DUE";
      const id = `pur-year-${month}-${j}`;

      const purchase = await prisma.purchase.create({
        data: {
          id,
          chalanNo: `CH-Y-${month + 1}-${j + 1}`,
          purchaseDate,
          subtotal,
          totalQuantity,
          discount: j === 1 ? 200 : 0,
          transportCost,
          vatAmount: 0,
          grandTotal,
          paidAmount: paid,
          dueAmount: due,
          paymentMethod: method,
          paymentStatus,
          branchId: branch.id,
          supplierId: supplierMap.get(supplier.id)!.id,
          shopId: shop.id,
          items: { create: items },
        },
      });

      purchaseRecords.push({
        id: purchase.id,
        supplierId: purchase.supplierId,
        purchaseDate,
        paid,
        due,
        paymentMethod: method,
      });
    }
  }

  // Payment vouchers for every purchase with a paid portion
  await prisma.supplierPayment.createMany({
    data: purchaseRecords
      .filter((record) => record.paid > 0)
      .map((record) => ({
        amount: record.paid,
        paymentMethod: record.paymentMethod,
        voucherNo: `PAY-${record.id}`,
        reference: record.id,
        note: "Seed purchase payment",
        paymentDate: record.purchaseDate,
        supplierId: record.supplierId,
        purchaseId: record.id,
        branchId: mainBranch.id,
      })),
  });

  // Derive supplier dues from the full purchase history
  const supplierDues = await prisma.purchase.groupBy({
    by: ["supplierId"],
    where: { shopId: shop.id },
    _sum: { dueAmount: true },
  });
  for (const row of supplierDues) {
    await prisma.supplier.update({
      where: { id: row.supplierId },
      data: { currentDue: Number(row._sum.dueAmount || 0) },
    });
  }

  // ==========================================
  // 6. CUSTOMERS (STRICT BRANCH ISOLATION)
  // ==========================================
  console.log("👤 [6/12] Seeding Customers with Strict Branch Ownership...");
  const customersData: Array<{
    id: string;
    name: string;
    phone: string;
    type: SeedCustomerType;
    due: number;
    limit: number;
    branchId: string;
  }> = [
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
        type: c.type,
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

  // Extra permanent customers for realistic khata volume
  const extraCustomerNames = [
    "মোঃ জাহাঙ্গীর আলম", "সাবিনা ইয়াসমিন", "আব্দুল্লাহ আল মামুন", "রুবিনা আক্তার", "মোঃ শাহীন মিয়া",
    "নাজমা বেগম", "সাইফুল ইসলাম", "মারিয়া খাতুন", "মোঃ ইব্রাহিম", "সুরাইয়া পারভীন",
    "মোঃ রাসেল আহমেদ", "ফাতেমা বেগম", "আবুল কালাম", "শারমিন সুলতানা", "মোঃ হাসান আলী",
    "রেহানা পারভীন", "মোঃ সোহেল রানা", "আনোয়ারা বেগম", "মোঃ ফরিদ মিয়া", "সালমা খাতুন",
    "মোঃ নাসির উদ্দিন", "জেসমিন আক্তার", "মোঃ আলমগীর", "রোকসানা বেগম", "মোঃ সেলিম রেজা",
    "মাহমুদা খাতুন", "মোঃ জসিম উদ্দিন", "নুরজাহান বেগম", "মোঃ আরিফ হোসেন", "শাহানা আক্তার",
  ];

  const extraCustomerRows = extraCustomerNames.map((name, index) => {
    const branchId = index % 2 === 0 ? mainBranch.id : mirpurBranch.id;
    return {
      id: `cust-extra-${index + 1}`,
      name,
      phone: `016${String(10000000 + index * 137).slice(0, 8)}`,
      type: "PERMANENT" as const,
      village: index % 2 === 0 ? "কাওরান বাজার" : "মিরপুর ১০",
      district: "ঢাকা",
      address: `বাসা ${10 + index}, রোড ${2 + (index % 12)}`,
      creditLimit: 20000 + (index % 5) * 10000,
      openingDue: 0,
      currentDue: 0,
      status: "active",
      shopId: shop.id,
      branchId,
    };
  });

  await prisma.customer.createMany({ data: extraCustomerRows });
  for (const row of extraCustomerRows) {
    customerMap.set(row.id, { id: row.id });
  }

  // ==========================================
  // 7. FULL-YEAR CONTINUOUS POS SALES ENGINE
  // ==========================================
  console.log("📈 [7/12] Generating 365 Days of POS Sales...");
  let invoiceCounter = 26000;
  const paymentMethods = ["cash", "cash", "cash", "bkash", "bkash", "nagad", "rocket", "due"];
  const mainPermanentCustIds = [
    "cust-tushi", "cust-haji", "cust-dr-kabir", "cust-master", "cust-anwar", "cust-babul",
    ...extraCustomerRows.filter((row) => row.branchId === mainBranch.id).map((row) => row.id),
  ];
  const mirpurPermanentCustIds = [
    "cust-nasima", "cust-kamal",
    ...extraCustomerRows.filter((row) => row.branchId === mirpurBranch.id).map((row) => row.id),
  ];

  interface SeedSaleRecord {
    id: string;
    branchId: string;
    customerId: string;
    saleDate: Date;
    productId: string;
    unitId: string;
    unitPrice: number;
  }
  const saleSeedRecords: SeedSaleRecord[] = [];

  for (let daysAgo = 364; daysAgo >= 0; daysAgo--) {
    const invoicesToday = 14 + Math.floor((daysAgo * 7) % 7);

    for (let i = 0; i < invoicesToday; i++) {
      invoiceCounter++;
      const invNo = `INV-${invoiceCounter}`;
      const saleId = `sale-${invoiceCounter}`;

      const hour = 9 + ((i * 3 + daysAgo) % 13);
      const minute = (i * 17) % 60;
      const saleTimestamp = new Date();
      saleTimestamp.setDate(saleTimestamp.getDate() - daysAgo);
      saleTimestamp.setHours(hour, minute, 0, 0);

      const method = paymentMethods[(daysAgo + i) % paymentMethods.length];
      const isDue = method === "due";

      // Distribute roughly 25% of invoices to Mirpur
      const isMirpur = i % 4 === 3;
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

      const numItems = 2 + ((daysAgo + i) % 4);
      const selectedProducts: SeedProduct[] = [];
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
      const paidAmount = isDue
        ? Math.floor(grandTotal * (0.25 + (i % 3) * 0.15))
        : grandTotal;
      const dueAmount = grandTotal - paidAmount;
      const paymentStatus = dueAmount === 0 ? "paid" : paidAmount > 0 ? "partial" : "due";

      await prisma.sale.create({
        data: {
          id: saleId,
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

      const first = lineItems[0];
      if (first) {
        saleSeedRecords.push({
          id: saleId,
          branchId: activeBranchId,
          customerId,
          saleDate: saleTimestamp,
          productId: first.productId,
          unitId: first.unitId,
          unitPrice: first.unitPrice,
        });
      }
    }
  }
  console.log(`✅ Seeded ${invoiceCounter - 26000} historical POS invoices!`);

  // Full-year sale returns
  const saleReturns = [];
  for (let i = 0; i < 90; i++) {
    const record = saleSeedRecords[(i * 37) % saleSeedRecords.length];
    if (!record) continue;
    const returnDate = new Date(record.saleDate);
    returnDate.setDate(returnDate.getDate() + 1 + (i % 7));
    if (returnDate > new Date()) continue;

    const condition = i % 5 === 0 ? "DAMAGED" : "RESTOCK";
    saleReturns.push({
      id: `sret-${i + 1}`,
      returnNo: `RET-Y-${String(i + 1).padStart(3, "0")}`,
      returnDate,
      totalRefund: record.unitPrice,
      refundMethod: i % 3 === 0 ? "balance" : "cash",
      notes: "Seed yearly customer return",
      branchId: record.branchId,
      saleId: record.id,
      customerId: record.customerId,
      userId: record.branchId === mirpurBranch.id ? mirpurCashierUser.id : cashierUser.id,
      shopId: shop.id,
      items: {
        create: [
          {
            productId: record.productId,
            unitId: record.unitId,
            quantity: 1,
            refundPrice: record.unitPrice,
            itemCondition: condition as "RESTOCK" | "DAMAGED",
          },
        ],
      },
    });
  }
  for (const ret of saleReturns) {
    await prisma.saleReturn.create({ data: ret });
  }

  // Full-year customer due collections
  const allPermanentCustomerIds = [...mainPermanentCustIds, ...mirpurPermanentCustIds];
  const customerBranchMap = new Map<string, string>();
  for (const id of mainPermanentCustIds) customerBranchMap.set(id, mainBranch.id);
  for (const id of mirpurPermanentCustIds) customerBranchMap.set(id, mirpurBranch.id);
  for (const row of extraCustomerRows) customerBranchMap.set(row.id, row.branchId);

  const customerPayments = [];
  for (let i = 0; i < 240; i++) {
    const customerId = allPermanentCustomerIds[i % allPermanentCustomerIds.length];
    const branchId = customerBranchMap.get(customerId);
    if (!branchId) continue;
    const paymentDate = new Date();
    paymentDate.setDate(paymentDate.getDate() - ((i * 3) % 360));
    paymentDate.setHours(11, (i * 7) % 60, 0, 0);
    customerPayments.push({
      paymentDate,
      amount: 500 + ((i * 173) % 4500),
      paymentMethod: ["cash", "bkash", "bank", "nagad"][i % 4],
      receiptNo: `REC-Y-${String(i + 1).padStart(4, "0")}`,
      reference: "Seed yearly due collection",
      note: "খাতার বকেয়া আদায়",
      branchId,
      customerId,
    });
  }
  await prisma.customerPayment.createMany({ data: customerPayments });

  // Keep customer dues consistent with the generated year of sales/payments
  const [salesDue, paymentsMade] = await Promise.all([
    prisma.sale.groupBy({
      by: ["customerId"],
      where: { shopId: shop.id, customerId: { not: null } },
      _sum: { dueAmount: true },
    }),
    prisma.customerPayment.groupBy({
      by: ["customerId"],
      _sum: { amount: true },
    }),
  ]);
  const paymentMap = new Map(paymentsMade.map((row) => [row.customerId, Number(row._sum.amount || 0)]));
  for (const row of salesDue) {
    if (!row.customerId) continue;
    const outstanding = Math.max(
      0,
      Number(row._sum.dueAmount || 0) - (paymentMap.get(row.customerId) || 0)
    );
    await prisma.customer.update({
      where: { id: row.customerId },
      data: { currentDue: outstanding },
    });
  }

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
    { name: "মার্কেটিং ও প্রচার (Marketing)", code: "EXP-MKT" },
    { name: "ইন্টারনেট ও যোগাযোগ (Internet)", code: "EXP-UTIL" },
    { name: "প্যাকেজিং সামগ্রী (Packaging)", code: "EXP-PACK" },
    { name: "সরকারি ফি ও লাইসেন্স (Govt Fees)", code: "EXP-GOV" },
  ];

  const expenseCatMap = new Map();
  for (const ec of expenseCatsData) {
    const cat = await prisma.expenseCategory.create({
      data: { name: ec.name, code: ec.code, status: "active", shopId: shop.id },
    });
    expenseCatMap.set(ec.code, cat.id);
  }

  const expensesToSeed: Array<{
    voucherNo: string;
    expenseDate: Date;
    amount: number;
    paymentMethod: string;
    reference: string;
    note: string;
    categoryId: string;
    branchId: string;
    shopId: string;
  }> = [];
  for (let d = 364; d >= 0; d -= 2) {
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

  // Monthly operating costs for the full year
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  for (let m = 11; m >= 0; m--) {
    const monthDate = new Date();
    monthDate.setMonth(monthDate.getMonth() - m);
    const monthLabel = monthNames[monthDate.getMonth()];
    const yearLabel = monthDate.getFullYear();

    const rentDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), 3);
    const elecDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), 8);
    const utilDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), 10);
    const maintDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), 15);
    const mktDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), 20);

    expensesToSeed.push(
      {
        voucherNo: `VCH-RENT-${yearLabel}-${monthDate.getMonth() + 1}-M`,
        expenseDate: rentDate,
        amount: 25000,
        paymentMethod: "bank",
        reference: `Main branch rent ${monthLabel} ${yearLabel}`,
        note: "কাওরান বাজার দোকান ভাড়া",
        categoryId: expenseCatMap.get("EXP-RENT")!,
        branchId: mainBranch.id,
        shopId: shop.id,
      },
      {
        voucherNo: `VCH-RENT-${yearLabel}-${monthDate.getMonth() + 1}-MP`,
        expenseDate: rentDate,
        amount: 18000,
        paymentMethod: "bank",
        reference: `Mirpur branch rent ${monthLabel} ${yearLabel}`,
        note: "মিরপুর শাখার দোকান ভাড়া",
        categoryId: expenseCatMap.get("EXP-RENT")!,
        branchId: mirpurBranch.id,
        shopId: shop.id,
      },
      {
        voucherNo: `VCH-ELEC-${yearLabel}-${monthDate.getMonth() + 1}`,
        expenseDate: elecDate,
        amount: 6200 + (m % 4) * 450,
        paymentMethod: "bank",
        reference: `DESCO electricity ${monthLabel}`,
        note: `${monthLabel} ${yearLabel} বিদ্যুৎ বিল`,
        categoryId: expenseCatMap.get("EXP-ELEC")!,
        branchId: mainBranch.id,
        shopId: shop.id,
      },
      {
        voucherNo: `VCH-UTIL-${yearLabel}-${monthDate.getMonth() + 1}`,
        expenseDate: utilDate,
        amount: 1200 + (m % 3) * 200,
        paymentMethod: "bkash",
        reference: `Internet & phone ${monthLabel}`,
        note: "ইন্টারনেট ও মোবাইল বিল",
        categoryId: expenseCatMap.get("EXP-UTIL")!,
        branchId: mainBranch.id,
        shopId: shop.id,
      },
      {
        voucherNo: `VCH-MAINT-${yearLabel}-${monthDate.getMonth() + 1}`,
        expenseDate: maintDate,
        amount: 900 + (m % 5) * 300,
        paymentMethod: "cash",
        reference: `Store maintenance ${monthLabel}`,
        note: "দোকান মেরামত ও রক্ষণাবেক্ষণ",
        categoryId: expenseCatMap.get("EXP-MAINT")!,
        branchId: mainBranch.id,
        shopId: shop.id,
      },
      {
        voucherNo: `VCH-MKT-${yearLabel}-${monthDate.getMonth() + 1}`,
        expenseDate: mktDate,
        amount: 1800 + (m % 4) * 500,
        paymentMethod: "cash",
        reference: `Local marketing ${monthLabel}`,
        note: "লোকাল প্রচার ও লিফলেট",
        categoryId: expenseCatMap.get("EXP-MKT")!,
        branchId: mainBranch.id,
        shopId: shop.id,
      }
    );
  }

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

  // Other income across the year (scrap sales, delivery fees, commissions)
  const otherIncomes = [];
  for (let m = 11; m >= 0; m--) {
    const incomeDate = new Date();
    incomeDate.setMonth(incomeDate.getMonth() - m);
    incomeDate.setDate(6);
    otherIncomes.push({
      incomeSource: "স্ক্র্যাপ ও কার্টন বিক্রয় (Scrap Sale)",
      receiptNo: `INC-SCRAP-${m + 1}`,
      incomeDate,
      amount: 1200 + (m % 4) * 350,
      paymentMethod: "cash",
      reference: "Monthly scrap sale",
      note: "কার্টন, বোতল ও পুরনো প্যাকেট বিক্রয়",
      branchId: mainBranch.id,
      userId: cashierUser.id,
      shopId: shop.id,
    });

    const deliveryDate = new Date();
    deliveryDate.setMonth(deliveryDate.getMonth() - m);
    deliveryDate.setDate(18);
    otherIncomes.push({
      incomeSource: "ডেলিভারি সার্ভিস চার্জ (Delivery Fee)",
      receiptNo: `INC-DEL-${m + 1}`,
      incomeDate: deliveryDate,
      amount: 800 + (m % 3) * 250,
      paymentMethod: "bkash",
      reference: "Home delivery charges",
      note: "হোম ডেলিভারি সার্ভিস আয়",
      branchId: mainBranch.id,
      userId: cashierUser.id,
      shopId: shop.id,
    });
  }
  await prisma.otherIncome.createMany({ data: otherIncomes });

  // Owner capital injections and drawings for the year
  const ownerTransactions = [];
  for (let m = 11; m >= 0; m--) {
    const capitalDate = new Date();
    capitalDate.setMonth(capitalDate.getMonth() - m);
    capitalDate.setDate(2);
    ownerTransactions.push({
      type: "CAPITAL" as const,
      transactionDate: capitalDate,
      amount: 25000 + (m % 4) * 5000,
      paymentMethod: "bank",
      reference: `Owner capital ${m + 1}`,
      purpose: "Business working capital",
      notes: "মালিকের মাসিক মূলধন জমা",
      branchId: mainBranch.id,
      shopId: shop.id,
    });

    const drawingDate = new Date();
    drawingDate.setMonth(drawingDate.getMonth() - m);
    drawingDate.setDate(25);
    ownerTransactions.push({
      type: "DRAWING" as const,
      transactionDate: drawingDate,
      amount: 9000 + (m % 5) * 1500,
      paymentMethod: "cash",
      reference: `Owner drawing ${m + 1}`,
      purpose: "Household and personal expense",
      notes: "মালিকের ব্যক্তিগত উত্তোলন",
      branchId: mainBranch.id,
      shopId: shop.id,
    });
  }
  await prisma.ownerTransaction.createMany({ data: ownerTransactions });

  // Additional fixed assets
  await prisma.companyAsset.createMany({
    data: [
      { name: "ডেলিভারি মোটরসাইকেল (Honda)", assetCode: "AST-BIKE-01", purchaseDate: new Date("2024-11-10"), purchaseCost: 165000, currentValue: 140000, condition: "GOOD", notes: "হোম ডেলিভারির জন্য", branchId: mainBranch.id, shopId: shop.id },
      { name: "ওয়ালটন ফ্রিজ ৩০০ লিটার", assetCode: "AST-FRZ-02", purchaseDate: new Date("2025-02-14"), purchaseCost: 42000, currentValue: 35000, condition: "GOOD", notes: "মিরপুর শাখার ফ্রিজ", branchId: mirpurBranch.id, shopId: shop.id },
      { name: "কম্পিউটার ও মনিটর সেট", assetCode: "AST-PC-01", purchaseDate: new Date("2025-05-01"), purchaseCost: 38000, currentValue: 30000, condition: "GOOD", notes: "POS ও হিসাবের জন্য", branchId: mainBranch.id, shopId: shop.id },
      { name: "বিলিং প্রিন্টার (EPSON)", assetCode: "AST-PRN-01", purchaseDate: new Date("2025-05-01"), purchaseCost: 22000, currentValue: 17500, condition: "GOOD", notes: "ইনভয়েস প্রিন্টার", branchId: mainBranch.id, shopId: shop.id },
      { name: "শেলফ ও ডিসপ্লে র্যাক", assetCode: "AST-RACK-01", purchaseDate: new Date("2024-09-20"), purchaseCost: 65000, currentValue: 50000, condition: "GOOD", notes: "দোকানের ডিসপ্লে র্যাক", branchId: mainBranch.id, shopId: shop.id },
      { name: "সিসিটিভি ক্যামেরা সেট (৮ চ্যানেল)", assetCode: "AST-CCTV-01", purchaseDate: new Date("2025-01-10"), purchaseCost: 28000, currentValue: 22000, condition: "GOOD", notes: "নিরাপত্তা ক্যামেরা", branchId: mainBranch.id, shopId: shop.id },
      { name: "ইলেকট্রিক ওজন স্কেল ১০০ কেজি", assetCode: "AST-SCL-02", purchaseDate: new Date("2024-12-05"), purchaseCost: 9500, currentValue: 7000, condition: "GOOD", notes: "মিরপুর শাখার স্কেল", branchId: mirpurBranch.id, shopId: shop.id },
      { name: "জেনারেটর (Walton 2.5 KVA)", assetCode: "AST-GEN-01", purchaseDate: new Date("2025-03-15"), purchaseCost: 85000, currentValue: 72000, condition: "MAINTENANCE", notes: "লোডশেডিং ব্যাকআপ", branchId: mainBranch.id, shopId: shop.id },
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
    { name: "মোঃ রফিকুল ইসলাম", phone: "01711334455", desig: "Senior Cashier", basic: 18000, dept: "SALES", branch: mainBranch.id, joined: "2024-02-01" },
    { name: "কাজী ফারুক", phone: "01811445566", desig: "Store Manager", basic: 24000, dept: "ACC", branch: mainBranch.id, joined: "2023-06-15" },
    { name: "আল-আমিন মোল্লা", phone: "01911556677", desig: "Inventory Keeper", basic: 14000, dept: "WH", branch: mainBranch.id, joined: "2024-04-10" },
    { name: "সুমন হোসেন", phone: "01611667788", desig: "Mirpur Cashier", basic: 16000, dept: "SALES", branch: mirpurBranch.id, joined: "2024-07-01" },
    { name: "মোঃ সাইফুল ইসলাম", phone: "01722778899", desig: "Sales Associate", basic: 13000, dept: "SALES", branch: mainBranch.id, joined: "2025-01-05" },
    { name: "নাফিসা আক্তার", phone: "01833889900", desig: "Junior Accountant", basic: 17000, dept: "ACC", branch: mainBranch.id, joined: "2025-02-12" },
    { name: "মোঃ জাহিদ হাসান", phone: "01944990011", desig: "Stock Assistant", basic: 12500, dept: "WH", branch: mainBranch.id, joined: "2025-03-20" },
    { name: "আব্দুর রহিম", phone: "01655001122", desig: "Delivery Driver", basic: 15000, dept: "WH", branch: mainBranch.id, joined: "2024-09-01" },
    { name: "মোঃ শাহিন আলম", phone: "01766112233", desig: "Mirpur Manager", basic: 22000, dept: "SALES", branch: mirpurBranch.id, joined: "2024-05-18" },
    { name: "রুমা খাতুন", phone: "01877223344", desig: "Cashier", basic: 14500, dept: "SALES", branch: mirpurBranch.id, joined: "2025-04-02" },
    { name: "মোঃ কামরুল ইসলাম", phone: "01988334455", desig: "Security Guard", basic: 12000, dept: "WH", branch: mainBranch.id, joined: "2024-08-11" },
    { name: "শাহিদা বেগম", phone: "01699445566", desig: "Cleaner", basic: 10000, dept: "WH", branch: mirpurBranch.id, joined: "2025-05-09" },
  ];

  const staffRecords: {
    id: string;
    basic: number;
    branchId: string;
    name: string;
  }[] = [];

  for (const st of staffProfiles) {
    const staff = await prisma.staffProfile.create({
      data: {
        name: st.name,
        phone: st.phone,
        designation: st.desig,
        joiningDate: new Date(st.joined),
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
    staffRecords.push({
      id: staff.id,
      basic: Number(staff.basicSalary),
      branchId: staff.branchId,
      name: staff.name,
    });
  }

  // 12 months of payroll for every staff member
  const payrolls: Prisma.PayrollCreateManyInput[] = [];
  const payrollBase = new Date();
  for (let offset = 11; offset >= 0; offset--) {
    const salaryDate = new Date(
      payrollBase.getFullYear(),
      payrollBase.getMonth() - offset,
      28
    );
    const monthIndex = salaryDate.getMonth();

    staffRecords.forEach((staff, staffIndex) => {
      const allowance = 1800 + (offset % 4) * 300;
      const overtimeAmount = 400 + ((offset + staffIndex) % 5) * 250;
      const advanceDeduction = offset % 3 === 0 ? 800 : 0;
      const netSalary = staff.basic + allowance + overtimeAmount - advanceDeduction;

      payrolls.push({
        payslipNo: `PS-${salaryDate.getFullYear()}-${monthIndex + 1}-${String(staffIndex + 1).padStart(2, "0")}`,
        month: monthNames[monthIndex],
        year: salaryDate.getFullYear(),
        salaryDate,
        basicSalary: staff.basic,
        allowance,
        overtimeAmount,
        advanceDeduction,
        penaltyDeduction: 0,
        netSalary,
        paymentMethod: ["cash", "bank", "bkash"][(offset + staffIndex) % 3],
        paymentStatus: "paid",
        notes: "Seed monthly payroll",
        branchId: staff.branchId,
        staffId: staff.id,
        shopId: shop.id,
      });
    });
  }
  await prisma.payroll.createMany({ data: payrolls });

  // Salary advances across the year
  const advances = [];
  for (let i = 0; i < 48; i++) {
    const staff = staffRecords[i % staffRecords.length];
    const advanceDate = new Date();
    advanceDate.setDate(advanceDate.getDate() - ((i * 9) % 360));
    advances.push({
      advanceDate,
      amount: 1000 + ((i * 137) % 4000),
      paymentMethod: ["cash", "bkash", "bank"][i % 3],
      purpose: ["Medical emergency", "Family expense", "Festival advance", "Personal need"][i % 4],
      isDeducted: i % 4 === 0,
      notes: "Seed staff advance",
      branchId: staff.branchId,
      staffId: staff.id,
      shopId: shop.id,
    });
  }
  await prisma.salaryAdvance.createMany({ data: advances });

  // ==========================================
  // 11. DAY-END Z-REPORT REGISTERS (FULL YEAR)
  // ==========================================
  console.log("🔒 [11/12] Seeding 365 Days of Day-End Z-Closings...");
  const closings = [];
  for (let day = 364; day >= 0; day--) {
    for (const branch of [mainBranch, mirpurBranch]) {
      const isMirpur = branch.id === mirpurBranch.id;
      const closingDate = new Date();
      closingDate.setDate(closingDate.getDate() - day);
      closingDate.setHours(22, 45, 0, 0);

      const openingCash = isMirpur ? 9000 : 12000;
      const cashSales = (isMirpur ? 16000 : 26000) + (day % 7) * (isMirpur ? 700 : 1200);
      const cashDueCollected = 2200 + (day % 5) * 350;
      const cashOtherIncome = day % 6 === 0 ? 450 : 0;
      const cashExpenses = 900 + (day % 4) * 300;
      const cashSupplierPaid = day % 5 === 0 ? 8000 : 0;
      const cashRefunds = day % 11 === 0 ? 750 : 0;

      const expectedCash =
        openingCash + cashSales + cashDueCollected + cashOtherIncome - cashExpenses - cashSupplierPaid - cashRefunds;
      const diff = day % 37 === 0 ? -50 : day % 43 === 0 ? 30 : 0;
      const countedCash = expectedCash + diff;

      closings.push({
        closingDate,
        openingTime: "08:30:00",
        closingTime: "22:45:00",
        openingCash,
        cashSales,
        cashDueCollected,
        cashOtherIncome,
        cashExpenses,
        cashSupplierPaid,
        cashRefunds,
        expectedCash,
        countedCash,
        difference: diff,
        totalInvoices: (isMirpur ? 18 : 30) + (day % 9),
        notes: diff === 0 ? "দিনশেষে হিসাব নিখুঁতভাবে মিলেছে।" : `ক্যাশ ড্রয়ারে ${diff} টাকার অমিল পরিলক্ষিত হয়েছে।`,
        status: "closed",
        branchId: branch.id,
        userId: isMirpur ? mirpurCashierUser.id : cashierUser.id,
        shopId: shop.id,
      });
    }
  }
  await prisma.cashRegister.createMany({ data: closings });

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
  const partnerRecords: { id: string; relationship: string; name: string }[] = [];
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
    partnerRecords.push({ id: p.id, relationship: fp.rel, name: p.name });
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

  // ==========================================
  // 12b. FULL-YEAR FAMILY LEDGER, RETURNS, ORDERS,
  //      QUOTATIONS, TRANSFERS, WASTAGE & LEDGER
  // ==========================================
  console.log("🧾 [12b] Seeding full-year family, returns, stock & order history...");

  if (mainCashId) {
    const partnerTransactions = [];
    const transactionTypes = [
      "CASH_DRAWING",
      "HOUSEHOLD_EXPENSE",
      "PROFIT_DISTRIBUTION",
      "BANK_DRAWING",
      "CASH_DRAWING",
      "HOUSEHOLD_EXPENSE",
    ] as const;

    for (let m = 11; m >= 0; m--) {
      for (let idx = 0; idx < partnerRecords.length; idx++) {
        const partner = partnerRecords[idx];
        const transactionDate = new Date();
        transactionDate.setMonth(transactionDate.getMonth() - m);
        transactionDate.setDate(8 + idx * 2);
        const type = idx === 0 && m % 3 === 0 ? ("CAPITAL_INJECTION" as const) : transactionTypes[idx];
        const isInjection = type === "CAPITAL_INJECTION";

        partnerTransactions.push({
          voucherNo: `PT-Y-${m + 1}-${idx + 1}`,
          type,
          amount: isInjection ? 25000 : 4000 + idx * 750 + (m % 4) * 500,
          transactionDate,
          purpose: isInjection ? "Additional family capital" : "Monthly family drawing",
          paymentMethod: idx % 2 === 0 ? "cash" : "bank",
          partnerId: partner.id,
          accountId: isInjection ? dbblId : mainCashId,
          branchId: mainBranch.id,
          shopId: shop.id,
        });
      }
    }
    await prisma.partnerTransaction.createMany({ data: partnerTransactions });

    for (let i = 0; i < 36; i++) {
      const partner = partnerRecords[i % partnerRecords.length];
      const rationDate = new Date();
      rationDate.setDate(rationDate.getDate() - ((i * 11) % 360));
      const items = [] as {
        productId: string;
        unitId: string;
        quantity: number;
        unitCost: number;
        lineTotal: number;
      }[];
      let totalCost = 0;
      for (let k = 0; k < 2; k++) {
        const product = productList[(i * 3 + k) % productList.length];
        const quantity = 1 + (k % 2);
        const lineTotal = quantity * product.purchasePrice;
        totalCost += lineTotal;
        items.push({
          productId: product.id,
          unitId: product.unitId,
          quantity,
          unitCost: product.purchasePrice,
          lineTotal,
        });
      }

      await prisma.partnerRation.create({
        data: {
          id: `rat-y-${i + 1}`,
          rationNo: `RAT-Y-${String(i + 1).padStart(3, "0")}`,
          rationDate,
          totalCost,
          notes: "Seed monthly home grocery",
          partnerId: partner.id,
          branchId: mainBranch.id,
          shopId: shop.id,
          items: { create: items },
        },
      });
    }
  }

  const yearLoans = [
    { id: "loan-y-1", type: "TAKEN" as const, name: "ব্যাংক ওয়ার্কিং ক্যাপিটাল", amount: 200000, paid: 80000 },
    { id: "loan-y-2", type: "TAKEN" as const, name: "মহাজন হাবিবুর রহমান", amount: 150000, paid: 50000 },
    { id: "loan-y-3", type: "GIVEN" as const, name: "কর্মচারী রফিকুল ইসলাম", amount: 25000, paid: 10000 },
    { id: "loan-y-4", type: "GIVEN" as const, name: "পার্টনার তারিকুল সেলিম", amount: 50000, paid: 20000 },
    { id: "loan-y-5", type: "TAKEN" as const, name: "সমিতি ঋণ (Cooperative)", amount: 120000, paid: 45000 },
    { id: "loan-y-6", type: "GIVEN" as const, name: "মোঃ বাবুল মিয়া", amount: 15000, paid: 5000 },
  ];

  await prisma.loan.createMany({
    data: yearLoans.map((loan, index) => {
      const loanDate = new Date();
      loanDate.setMonth(loanDate.getMonth() - (11 - index));
      loanDate.setDate(10);
      return {
        id: loan.id,
        loanNo: `LN-Y-${String(index + 1).padStart(3, "0")}`,
        type: loan.type,
        personName: loan.name,
        phone: `017${String(10000000 + index * 927).slice(0, 8)}`,
        amount: loan.amount,
        totalPaid: loan.paid,
        remainingAmount: loan.amount - loan.paid,
        loanDate,
        dueDate: new Date(loanDate.getFullYear() + 1, loanDate.getMonth(), 10),
        status: loan.paid >= loan.amount ? "PAID" : "ACTIVE",
        notes: "Seed yearly loan",
        branchId: mainBranch.id,
        accountId: index % 2 === 0 ? dbblId : mainCashId,
        shopId: shop.id,
      };
    }),
  });

  const loanInstallments: Prisma.LoanInstallmentCreateManyInput[] = [];
  yearLoans.forEach((loan, loanIndex) => {
    for (let i = 1; i <= 3; i++) {
      const paymentDate = new Date();
      paymentDate.setMonth(paymentDate.getMonth() - (11 - loanIndex) + i);
      paymentDate.setDate(15);
      if (paymentDate > new Date()) continue;
      loanInstallments.push({
        voucherNo: `LI-Y-${loanIndex + 1}-${i}`,
        paymentDate,
        amount: Math.round(loan.paid / 3),
        paymentMethod: i % 2 === 0 ? "bank" : "cash",
        note: "Seed loan installment",
        branchId: mainBranch.id,
        loanId: loan.id,
        accountId: i % 2 === 0 ? dbblId : mainCashId,
        userId: cashierUser.id,
      });
    }
  });
  await prisma.loanInstallment.createMany({ data: loanInstallments });

  const cheques = [];
  for (let i = 0; i < 12; i++) {
    const chequeDate = new Date();
    chequeDate.setDate(chequeDate.getDate() - (i * 27));
    cheques.push({
      type: (i % 2 === 0 ? "RECEIVED" : "ISSUED") as "RECEIVED" | "ISSUED",
      partyType: (i % 2 === 0 ? "CUSTOMER" : "SUPPLIER") as "CUSTOMER" | "SUPPLIER",
      partyName: i % 2 === 0 ? `Wholesale Customer ${i + 1}` : suppliersData[i % suppliersData.length].company,
      bankName: ["City Bank", "DBBL", "BRAC Bank", "Islami Bank"][i % 4],
      chequeNumber: `CHQ-Y-${String(1000 + i)}`,
      chequeDate,
      clearingDate: i % 3 === 0 ? new Date(chequeDate.getTime() + 3 * 86400000) : null,
      amount: 5000 + i * 3500,
      status: (i % 4 === 0 ? "CLEARED" : i % 4 === 1 ? "PENDING" : i % 4 === 2 ? "BOUNCED" : "CANCELLED") as
        | "CLEARED"
        | "PENDING"
        | "BOUNCED"
        | "CANCELLED",
      note: "Seed cheque history",
      branchId: mainBranch.id,
      accountId: dbblId,
      userId: cashierUser.id,
      shopId: shop.id,
    });
  }
  await prisma.bankCheque.createMany({ data: cheques });

  for (let i = 0; i < 18; i++) {
    const purchase = purchaseRecords[(i * 3) % purchaseRecords.length];
    const product = productList[(i * 7) % productList.length];
    const quantity = 1 + (i % 4);
    const unitCost = product.purchasePrice;
    const totalAmount = quantity * unitCost;
    const returnDate = new Date(purchase.purchaseDate);
    returnDate.setDate(returnDate.getDate() + 2 + (i % 5));

    await prisma.purchaseReturn.create({
      data: {
        id: `pret-y-${i + 1}`,
        returnNo: `PR-Y-${String(i + 1).padStart(3, "0")}`,
        returnDate,
        totalQuantity: quantity,
        totalAmount,
        refundAmount: i % 2 === 0 ? totalAmount : 0,
        dueDeduction: i % 2 === 0 ? 0 : totalAmount,
        settlementType: i % 2 === 0 ? "CASH_REFUND" : "DUE_DEDUCTION",
        paymentMethod: i % 2 === 0 ? "cash" : null,
        notes: "Seed purchase return",
        branchId: mainBranch.id,
        supplierId: purchase.supplierId,
        shopId: shop.id,
        purchaseId: purchase.id,
        items: {
          create: [
            {
              quantity,
              unitCost,
              lineTotal: totalAmount,
              reason: ["DAMAGED", "EXPIRED", "WRONG_ITEM", "POOR_QUALITY"][i % 4],
              productId: product.id,
            },
          ],
        },
      },
    });
  }

  for (let i = 0; i < 18; i++) {
    const supplier = suppliersData[i % suppliersData.length];
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - ((i * 17) % 360));
    const items = [];
    let estimatedTotal = 0;
    for (let k = 0; k < 3; k++) {
      const product = productList[(i * 5 + k) % productList.length];
      const quantity = 10 + ((i + k) % 20);
      const lineTotal = quantity * product.purchasePrice;
      estimatedTotal += lineTotal;
      items.push({
        productId: product.id,
        quantity,
        unitCost: product.purchasePrice,
        lineTotal,
        currentStock: 10 + ((i + k) % 30),
      });
    }

    await prisma.purchaseOrder.create({
      data: {
        id: `po-y-${i + 1}`,
        orderNo: `PO-Y-${String(i + 1).padStart(3, "0")}`,
        orderDate,
        status: i % 4 === 0 ? "CONVERTED" : i % 3 === 0 ? "SENT_TO_SR" : "DRAFT",
        totalItems: items.length,
        estimatedTotal,
        notes: "Seed purchase order",
        supplierId: supplierMap.get(supplier.id)!.id,
        branchId: i % 2 === 0 ? mainBranch.id : mirpurBranch.id,
        shopId: shop.id,
        items: { create: items },
      },
    });
  }

  const quotationCustomer = customerMap.get("cust-tushi");
  for (let i = 0; i < 15; i++) {
    const quotationDate = new Date();
    quotationDate.setDate(quotationDate.getDate() - ((i * 23) % 360));
    const items = [];
    let subtotal = 0;
    for (let k = 0; k < 3; k++) {
      const product = productList[(i * 4 + k) % productList.length];
      const quantity = 2 + ((i + k) % 6);
      const lineTotal = quantity * product.sellingPrice;
      subtotal += lineTotal;
      items.push({
        productId: product.id,
        unitId: product.unitId,
        quantity,
        unitPrice: product.sellingPrice,
        lineTotal,
      });
    }

    await prisma.quotation.create({
      data: {
        id: `quo-y-${i + 1}`,
        quotationNo: `QT-Y-${String(i + 1).padStart(3, "0")}`,
        quotationDate,
        expiryDate: new Date(quotationDate.getTime() + 15 * 86400000),
        subtotal,
        discount: i % 3 === 0 ? 100 : 0,
        grandTotal: subtotal - (i % 3 === 0 ? 100 : 0),
        status: i % 4 === 0 ? "CONVERTED" : i % 5 === 0 ? "EXPIRED" : "PENDING",
        notes: "Seed quotation",
        branchId: mainBranch.id,
        customerId: quotationCustomer?.id || null,
        shopId: shop.id,
        items: { create: items },
      },
    });
  }

  for (let i = 0; i < 20; i++) {
    const fromMain = i % 2 === 0;
    const dispatchDate = new Date();
    dispatchDate.setDate(dispatchDate.getDate() - ((i * 19) % 360));
    const status = i % 3 === 0 ? "COMPLETED" : i % 3 === 1 ? "DISPATCHED" : "CANCELLED";
    const items = [];
    let totalQuantity = 0;
    let totalCost = 0;

    for (let k = 0; k < 3; k++) {
      const product = productList[(i * 6 + k) % productList.length];
      const quantitySent = 5 + ((i + k) % 15);
      const transitDamage = status === "COMPLETED" && k === 0 ? 1 : 0;
      const received = status === "COMPLETED" ? quantitySent - transitDamage : null;
      const lineCost = quantitySent * product.purchasePrice;
      totalQuantity += quantitySent;
      totalCost += lineCost;
      items.push({
        productId: product.id,
        quantitySent,
        quantityReceived: received,
        transitDamage,
        unitCost: product.purchasePrice,
        lineCost,
      });
    }

    await prisma.stockTransfer.create({
      data: {
        id: `tr-y-${i + 1}`,
        transferNo: `TR-Y-${String(i + 1).padStart(3, "0")}`,
        dispatchDate,
        receiveDate: status === "COMPLETED" ? new Date(dispatchDate.getTime() + 86400000) : null,
        status,
        totalItems: items.length,
        totalQuantity,
        totalCost,
        notes: "Seed branch transfer",
        driverName: ["Karim", "Rahim", "Jamal", "Selim"][i % 4],
        driverPhone: `018${String(10000000 + i * 371).slice(0, 8)}`,
        vehicleNo: `DHAKA-METRO-${String(1000 + i)}`,
        fromBranchId: fromMain ? mainBranch.id : mirpurBranch.id,
        toBranchId: fromMain ? mirpurBranch.id : mainBranch.id,
        shopId: shop.id,
        items: { create: items },
      },
    });
  }

  const wastageReasons = [
    "ROTTEN_PERISHABLE",
    "BROKEN_DAMAGED",
    "EXPIRED_NO_RETURN",
    "PEST_DAMAGE",
    "INTERNAL_STORE_USE",
    "OTHER",
  ] as const;

  for (let i = 0; i < 40; i++) {
    const wastageDate = new Date();
    wastageDate.setDate(wastageDate.getDate() - ((i * 9) % 360));
    const branch = i % 2 === 0 ? mainBranch : mirpurBranch;
    const reason = wastageReasons[i % wastageReasons.length];
    const items = [];
    let totalQuantity = 0;
    let totalCost = 0;

    for (let k = 0; k < 2; k++) {
      const product = productList[(i * 5 + k) % productList.length];
      const quantity = 1 + ((i + k) % 6);
      const lineCost = quantity * product.purchasePrice;
      totalQuantity += quantity;
      totalCost += lineCost;
      items.push({
        productId: product.id,
        quantity,
        unitCost: product.purchasePrice,
        lineCost,
        reason,
      });
    }

    await prisma.stockWastage.create({
      data: {
        id: `wst-y-${i + 1}`,
        wastageNo: `WST-Y-${String(i + 1).padStart(3, "0")}`,
        date: wastageDate,
        totalQuantity,
        totalCost,
        reason,
        notes: "Seed stock wastage",
        branchId: branch.id,
        shopId: shop.id,
        items: { create: items },
      },
    });
  }

  const accountTransactions = [];
  const accountIds = [...accountMap.values()];
  for (let i = 0; i < 120; i++) {
    const accountId = accountIds[i % accountIds.length];
    const transactionDate = new Date();
    transactionDate.setDate(transactionDate.getDate() - ((i * 3) % 360));
    const amount = 500 + ((i * 211) % 9000);
    accountTransactions.push({
      type: (i % 3 === 0 ? "WITHDRAW" : "DEPOSIT") as "WITHDRAW" | "DEPOSIT",
      amount,
      balanceAfter: 10000 + i * 150,
      transactionDate,
      referenceType: "SEED",
      referenceId: `seed-tx-${i + 1}`,
      voucherNo: `LED-Y-${String(i + 1).padStart(4, "0")}`,
      note: "Seed account ledger entry",
      branchId: i % 2 === 0 ? mainBranch.id : mirpurBranch.id,
      accountId,
      userId: cashierUser.id,
    });
  }
  await prisma.accountTransaction.createMany({ data: accountTransactions });

  console.log("============================================================");
  console.log("🎉 SUCCESS: Master Seed Completed with High-Volume Data!");
  console.log("============================================================");
  console.log("🏢 Outlets:          2 Outlets (Main + Mirpur-10 Branch)");
  console.log("📦 Products:         72 Items (32 core + 40 extended catalog)");
  console.log(`💰 Sales History:    ${invoiceCounter - 26000} invoices across 365 days`);
  console.log("👥 Customer Khata:   40 Customers (Strict Branch Scoped)");
  console.log("👨‍👩‍👧‍👦 Family Ledger:   6 Partners + 72 yearly drawings + 36 rations");
  console.log("🚚 Suppliers:        12 FMCG Vendors + 41 purchase chalans");
  console.log("📉 Expenses:         12 months OPEX + daily food/transport entries");
  console.log("👨‍💼 Staff:            12 staff + 144 payrolls + 48 advances");
  console.log("🔒 Day-End Closings: 730 Z-Reports (365 days × 2 branches)");
  console.log("🧾 Extras:           90 sale returns, 18 purchase returns, 18 POs, 15 quotations");
  console.log("🔄 Stock Ops:        20 transfers + 40 wastage records");
  console.log("💳 Finance:          6 loans + installments, 12 cheques, 120 ledger entries");
  console.log("------------------------------------------------------------");
  console.log("🔑 Demo Login Accounts:");
  console.log("   OWNER:          owner@grocery.com");
  console.log("   MAIN MANAGER:   manager@grocery.com");
  console.log("   MAIN CASHIER:   cashier@grocery.com");
  console.log("   MIRPUR MANAGER: manager.mirpur@grocery.com");
  console.log("   MIRPUR CASHIER: cashier.mirpur@grocery.com");
  if (GENERATED_SEED_PASSWORD) {
    console.log(`   Generated password (change after first login): ${SEED_PASSWORD}`);
  } else {
    console.log("   Password: from the SEED_PASSWORD environment variable.");
  }
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