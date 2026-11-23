/**
 * Single source of truth for payment methods across the app.
 * Every payment form, filter and ledger helper must use these values.
 */
export const PAYMENT_METHODS = ["cash", "bank", "bkash", "nagad", "rocket"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type PaymentAccountType = "CASH" | "BANK" | "BKASH" | "NAGAD" | "ROCKET";

export interface PaymentMethodOption {
  value: PaymentMethod;
  label: string;
}

export const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank" },
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "rocket", label: "Rocket" },
];

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  bank: "Bank",
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
  card: "Card",
  due: "Due (Khata)",
  mixed: "Mixed",
  non_cash: "Non-cash",
  other: "Other",
};

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === "string" && (PAYMENT_METHODS as readonly string[]).includes(value);
}

export function normalizePaymentMethod(value?: string | null): PaymentMethod {
  const method = (value || "cash").trim().toLowerCase();
  return isPaymentMethod(method) ? method : "cash";
}

export function accountTypeForPaymentMethod(method: PaymentMethod): PaymentAccountType {
  return method.toUpperCase() as PaymentAccountType;
}

export function paymentMethodLabel(value?: string | null): string {
  const key = (value || "").trim().toLowerCase();
  return PAYMENT_METHOD_LABELS[key] || "—";
}
