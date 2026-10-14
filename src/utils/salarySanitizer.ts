/**
 * Defensive Salary Sanitizer & Normalizer
 * Handles:
 * - Integer cents (e.g. 10564320 -> 105,643.20)
 * - Hourly wages (e.g. $34.26/hr -> annualized 71,261)
 * - Upper ceiling bounding to prevent database outliers from distorting metrics
 */
export function normalizeJobSalaryValue(val: number | undefined | null, fallback = 65000): number {
  if (val === undefined || val === null || isNaN(val) || val <= 0) return fallback;
  let num = Number(val);
  if (isNaN(num) || num <= 0) return fallback;

  // Stored in integer cents (e.g., 10564320 or 9828000)
  if (num > 500000) {
    num = num / 100;
  }
  // Hourly wage detection (e.g. 15 to 120/hr) -> annualize (40 hrs/wk * 52 wks = 2080 hrs)
  if (num < 150) {
    num = num * 2080;
  }
  // Outlier clamping to prevent extreme values from distorting statistics
  if (num > 250000) {
    num = 200000;
  }
  if (num < 25000) {
    num = 45000;
  }
  return Math.round(num);
}
