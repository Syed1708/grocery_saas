import { z } from "zod";

// Category Validation Schema
export const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Category name must be at least 2 characters").max(50),
  description: z.string().max(300).optional().nullable(),
});

// Measurement Unit Validation Schema
export const unitSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Unit name must be at least 2 characters").max(30),
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
  barcode: z.string().min(3, "Barcode must be at least 3 characters"),
  description: z.string().max(500).optional().nullable(),
  costPrice: z.coerce.number().min(0, "Cost price cannot be negative"),
  sellingPrice: z.coerce.number().min(0.01, "Selling price must be greater than 0"),
  stockQuantity: z.coerce.number().min(0, "Stock cannot be negative").default(0),
  minStockAlert: z.coerce.number().min(0, "Alert level cannot be negative").default(5),
  unitId: z.string().min(1, "Please select a measurement unit"),
  categoryId: z.string().min(1, "Please select a category"),
  bulkUnitName: z.string().optional().nullable(),
  conversionFactor: z.coerce.number().min(1, "Conversion factor must be at least 1").default(1),
});

export type CategoryInput = z.infer<typeof categorySchema>;
export type UnitInput = z.infer<typeof unitSchema>;
export type ProductInput = z.infer<typeof productSchema>;