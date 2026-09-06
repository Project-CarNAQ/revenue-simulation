/**
 * Monetary and Numeric Precision Helpers
 * Ensures no IEEE-754 floating point artifacts reach callers.
 */

export function roundCurrency(num: number): number {
  if (isNaN(num) || !isFinite(num)) {
    return 0;
  }
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function roundMetric(num: number, decimals: number = 2): number {
  if (isNaN(num) || !isFinite(num)) {
    return 0;
  }
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}
