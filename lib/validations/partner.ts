import { z } from "zod";

export const partnerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Partner name must be at least 2 characters."),
  relationship: z.enum(["FATHER", "UNCLE", "BROTHER", "SELF", "OTHER"]),
  phone: z.string().optional().nullable(),
  nidNumber: z.string().optional().nullable(),
  equityPercent: z.coerce.number().min(0).max(100).default(0),
  openingCapital: z.coerce.number().min(0).default(0),
  monthlyAllowance: z.coerce.number().min(0).default(0),
  notes: z.string().optional().nullable(),
});

export const partnerDrawingSchema = z.object({
  partnerId: z.string().min(1, "Partner is required."),
  type: z.enum(["CASH_DRAWING", "BANK_DRAWING", "CAPITAL_INJECTION", "HOUSEHOLD_EXPENSE", "PROFIT_DISTRIBUTION"]),
  amount: z.coerce.number().positive("Amount must be greater than zero."),
  accountId: z.string().min(1, "Source account (Cash Drawer or Bank) is required."),
  purpose: z.string().min(2, "Please state the purpose."),
  transactionDate: z.string().optional(),
  notes: z.string().optional().nullable(),
});

export const partnerRationSchema = z.object({
  partnerId: z.string().min(1, "Partner is required."),
  notes: z.string().optional().nullable(),
  items: z.array(
    z.object({
      productId: z.string().min(1, "Product is required."),
      quantity: z.coerce.number().positive("Quantity must be greater than zero."),
    })
  ).min(1, "At least one grocery item must be selected."),
});