// lib/validations/user.ts
import { z } from "zod";
 
export const userSchema = z.object({
  id: z.string().optional().nullable(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  role: z.enum(["OWNER", "MANAGER", "CASHIER"]),
  branchId: z.string().optional().nullable(),
  supervisorPin: z
    .string()
    .length(4, "PIN must be exactly 4 digits")
    .regex(/^\d+$/, "PIN must contain only numbers")
    .optional()
    .nullable()
    .or(z.literal("")),
  
  // Coerce string "true"/"false" from form data into boolean
  isActive: z.preprocess((val) => {
    if (typeof val === "string") return val === "true";
    return Boolean(val);
  }, z.boolean().default(true)),

  // Parse stringified JSON array from hidden inputs safely
  customPermissions: z.preprocess((val) => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    }
    return Array.isArray(val) ? val : [];
  }, z.array(z.string()).default([])),
}).refine(
  (data) => {
    // Branch assignment is mandatory for Managers and Cashiers
    if (data.role !== "OWNER" && !data.branchId) {
      return false;
    }
    return true;
  },
  {
    message: "Branch assignment is mandatory for Managers and Cashiers.",
    path: ["branchId"],
  }
);

export type UserFormValues = z.infer<typeof userSchema>;