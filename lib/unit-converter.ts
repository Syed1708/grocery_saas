/**
 * Calculates stock change based on unit selected
 */
export function calculateBaseQuantity({
  quantity,
  isBulkUnit = false,
  conversionFactor = 1,
}: {
  quantity: number;
  isBulkUnit?: boolean;
  conversionFactor?: number;
}): number {
  if (isBulkUnit && conversionFactor > 1) {
    return quantity * conversionFactor;
  }
  return quantity;
}

/**
 * Converts metric weights (e.g., grams to kilograms)
 */
export function convertGramsToKg(grams: number): number {
  return grams / 1000;
}

/**
 * Converts metric volume (e.g., milliliters to liters)
 */
export function convertMlToLiters(ml: number): number {
  return ml / 1000;
}