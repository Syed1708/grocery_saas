import { z } from "zod";


export const shopProfileSchema = z.object({
  // 1. Active Branch Fields
  branchName: z.string().min(2, "Branch name is required"),
  phone: z.string().min(6, "Valid outlet phone is required"),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().min(3, "Outlet physical address is required"),

  // 2. Central Shop Credentials
  shopName: z.string().min(2, "Company brand name is required"),
  nameEn: z.string().optional().nullable(),
  tradeLicense: z.string().optional().nullable(),
  binVatNumber: z.string().optional().nullable(),
  currencySymbol: z.string().default("৳"),
});
export const receiptSettingsSchema = z.object({
  thermalWidth: z.enum(["80mm", "58mm"]),
  banglaReceipt: z.boolean(),
  invoiceHeader: z.string().max(200).optional().nullable(),
  invoiceFooter: z.string().max(300).optional().nullable(),
});

export const vatSettingsSchema = z.object({
  enableVat: z.boolean(),
  vatPercent: z.coerce.number().min(0).max(100),
  binVatNumber: z.string().optional().nullable(),
});

export const branchSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Branch name is required"),
  code: z.string().min(2, "Unique branch code is required"),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional().nullable(),
  
  // 👈 ADD THIS LINE:
  isMain: z.boolean().default(false),
  
  status: z.enum(["active", "inactive"]).default("active"),
});

export type ShopProfileInput = z.infer<typeof shopProfileSchema>;
export type ReceiptSettingsInput = z.infer<typeof receiptSettingsSchema>;
export type VatSettingsInput = z.infer<typeof vatSettingsSchema>;
export type BranchInput = z.infer<typeof branchSchema>;