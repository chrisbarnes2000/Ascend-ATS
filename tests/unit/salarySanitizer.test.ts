import assert from 'assert';
import { normalizeJobSalaryValue } from '../../src/utils/salarySanitizer';

export function runSalarySanitizerTests() {
  console.log('Starting salarySanitizer unit test suite...');

  // Test 1: Cent-stored numbers (e.g., $105,643.20 stored as 10564320)
  const val1 = normalizeJobSalaryValue(10564320);
  assert.strictEqual(val1, 105643, 'Cent-stored value 10564320 must be normalized to 105643');
  console.log('✓ Test 1: Cent-stored salary 10564320 normalized to $105,643');

  // Test 2: Cent-stored numbers (e.g., $98,280.00 stored as 9828000)
  const val2 = normalizeJobSalaryValue(9828000);
  assert.strictEqual(val2, 98280, 'Cent-stored value 9828000 must be normalized to 98280');
  console.log('✓ Test 2: Cent-stored salary 9828000 normalized to $98,280');

  // Test 3: Hourly wage (e.g., $34.26/hr -> 34.26 * 2080 = 71260.8)
  const val3 = normalizeJobSalaryValue(34.26);
  assert.strictEqual(val3, 71261, 'Hourly wage 34.26 must be annualized to 71261');
  console.log('✓ Test 3: Hourly wage $34.26 annualized to $71,261');

  // Test 4: Standard normal salary (e.g., $65,000)
  const val4 = normalizeJobSalaryValue(65000);
  assert.strictEqual(val4, 65000, 'Standard salary 65000 must remain 65000');
  console.log('✓ Test 4: Standard normal salary remains unchanged');

  // Test 5: Outlier clamping and zero/null fallback
  const val5 = normalizeJobSalaryValue(undefined, 60000);
  assert.strictEqual(val5, 60000, 'Undefined value must return fallback');

  const val6 = normalizeJobSalaryValue(500000);
  assert.ok(val6 <= 200000, 'Excessive outlier salary must be clamped');
  console.log('✓ Test 5: Fallbacks and outlier bounds verified');

  console.log('All salarySanitizer unit tests passed successfully!');
}

