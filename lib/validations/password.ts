import { z } from "zod";

/** Shared password policy: 8–72 chars, at least one letter and one number. */
export const strongPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[A-Za-z]/, "Password must contain at least one letter")
  .regex(/\d/, "Password must contain at least one number");

export function validateStrongPassword(value: string): string | null {
  const parsed = strongPasswordSchema.safeParse(value);
  return parsed.success ? null : parsed.error.issues[0].message;
}
