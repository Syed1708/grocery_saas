import { z } from "zod";


// 👈 Add Register Schema to lib/validations/index.ts
export const registerSchema = z.object({
  shopName: z.string().min(2, "Store name must be at least 2 characters").max(100),
  phone: z.string().min(5, "Phone number is too short").max(20),
  currency: z.string().default("BDT"),
  currencySymbol: z.string().default("৳"),
  village: z.string().max(50).optional().nullable(),
  district: z.string().max(50).optional().nullable(),
  ownerName: z.string().min(2, "Owner name must be at least 2 characters").max(70),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});


// Category Validation Schema
export const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Category name must be at least 2 characters").max(50),
  description: z.string().max(300).optional().nullable(),
    status: z.enum(["active", "inactive"]).default("active"),
});

// Measurement Unit Validation Schema
export const unitSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Unit name must be at least 2 characters").max(30),
    status: z.enum(["active", "inactive"]).default("active"),
  code: z
    .string()
    .min(1, "Unit code is required")
    .max(10, "Unit code cannot exceed 10 characters")
    .toLowerCase(),
});

// Product Validation Schema
export const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Product name must be at least 2 characters").max(100),
  nameEn: z.string().max(100).optional().nullable(),
  barcode: z.string().min(3, "Barcode must be at least 3 characters"),
  sku: z.string().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  costPrice: z.coerce.number().min(0, "Cost price cannot be negative").default(0),
  sellingPrice: z.coerce.number().min(0.01, "Selling price must be greater than 0"),
  wholesalePrice: z.coerce.number().min(0).optional().nullable(),
  vatPercent: z.coerce.number().min(0).max(100).default(0), // 👈 Added
  expiryDate: z.string().optional().nullable(), // 👈 Added
  stockQuantity: z.coerce.number().min(0).default(0),
  minStockAlert: z.coerce.number().min(0).default(5),
  unitId: z.string().min(1, "Please select a measurement unit"),
  categoryId: z.string().min(1, "Please select a category"),
  brandId: z.string().optional().nullable(),
  sectionId: z.string().optional().nullable(),
  bulkUnitName: z.string().optional().nullable(),
  conversionFactor: z.coerce.number().min(1).default(1),
  status: z.enum(["active", "inactive"]).default("active"), // 👈 Added
});

export const customerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Customer name must be at least 2 characters").max(70),
  phone: z.string().min(5, "Phone number is too short").max(20).optional().nullable(),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  type: z.enum(["WALK_IN", "PERMANENT"]).default("PERMANENT"),
  village: z.string().max(50).optional().nullable(),
  district: z.string().max(50).optional().nullable(),
  addressLine: z.string().max(150).optional().nullable(),
  creditLimit: z.coerce.number().min(0, "Credit limit cannot be negative").default(0),
  openingBalance: z.coerce.number().default(0),
    status: z.enum(["active", "inactive"]).default("active"),
});



export const supplierSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Contact person name is required"),
  companyName: z.string().min(2, "Company / Distributor name is required"),
  phone: z.string().min(5, "Phone number is required"),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  village: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  addressLine: z.string().optional().nullable(),
  openingBalance: z.coerce.number().default(0),
    status: z.enum(["active", "inactive"]).default("active"),
});



// 3. Brand Schema
export const brandSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Brand name is required").max(100),
  companyName: z.string().max(100).optional().nullable(),
  contactPerson: z.string().max(100).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  status: z.enum(["active", "inactive"]).default("active"),
});

// 4. Section / Shelf Schema
export const sectionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Shelf name is required").max(100),
  code: z.string().max(30).optional().nullable(),
  description: z.string().max(255).optional().nullable(),
  status: z.enum(["active", "inactive"]).default("active"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type UnitInput = z.infer<typeof unitSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type SupplierInput = z.infer<typeof supplierSchema>;
export type BrandInput = z.infer<typeof brandSchema>;
export type SectionInput = z.infer<typeof sectionSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;


// 8. Account / Wallet Schema
export const accountSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Account name is required").max(100),
  type: z.enum(["CASH", "BANK", "BKASH", "NAGAD", "ROCKET", "OTHER"]).default("CASH"),
  accountNumber: z.string().max(100).optional().nullable(),
  bankName: z.string().max(100).optional().nullable(),
  branchName: z.string().max(100).optional().nullable(),
  openingBalance: z.coerce.number().default(0),
  status: z.enum(["active", "inactive"]).default("active"),
  notes: z.string().max(255).optional().nullable(),
});

// 9. Fund Transfer Schema
export const transferSchema = z.object({
  fromAccountId: z.string().min(1, "Source account is required"),
  toAccountId: z.string().min(1, "Destination account is required"),
  amount: z.coerce.number().gt(0, "Transfer amount must be greater than 0"),
  transferDate: z.string().min(1, "Date is required"),
  note: z.string().max(255).optional().nullable(),
});

// 10. Bank Cheque Schema
export const chequeSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["RECEIVED", "ISSUED"]).default("RECEIVED"),
  partyType: z.enum(["CUSTOMER", "SUPPLIER", "OTHER"]).default("CUSTOMER"),
  partyName: z.string().min(2, "Party name is required").max(100),
  bankName: z.string().min(2, "Bank name is required").max(100),
  chequeNumber: z.string().min(2, "Cheque number is required").max(50),
  chequeDate: z.string().min(1, "Cheque date is required"),
  amount: z.coerce.number().gt(0, "Amount must be greater than 0"),
  note: z.string().max(255).optional().nullable(),
});

// 11. Loan / Hawlat Schema
export const loanSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["TAKEN", "GIVEN"]).default("TAKEN"),
  personName: z.string().min(2, "Person name is required").max(100),
  phone: z.string().max(20).optional().nullable(),
  amount: z.coerce.number().gt(0, "Amount must be greater than 0"),
  loanDate: z.string().min(1, "Loan date is required"),
  dueDate: z.string().optional().nullable(),
  accountId: z.string().min(1, "Please select an account/wallet"),
  notes: z.string().max(255).optional().nullable(),
});

export type AccountInput = z.infer<typeof accountSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
export type ChequeInput = z.infer<typeof chequeSchema>;
export type LoanInput = z.infer<typeof loanSchema>;