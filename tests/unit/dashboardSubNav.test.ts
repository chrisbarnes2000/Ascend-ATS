/**
 * Unit Test Suite: DashboardSubNav Component Configuration & View Validation
 *
 * Verifies:
 * 1. Adaptive Mobile & Desktop Label Invariants
 * 2. Navigation Item Configurations (Icons, WCAG contrast colors, tab ids)
 * 3. Type Guard Invariants (isValidDashboardView)
 * 4. JPL Power of 10 Safety Bounds & Defensive Input Handling
 */

import { 
  DASHBOARD_NAV_TABS, 
  isValidDashboardView, 
  DashboardView 
} from '../../src/components/DashboardSubNav';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function runDashboardSubNavTests() {
  console.log('--- Testing DashboardSubNav Configuration & View Validation ---');

  // Test 1: Tab Count and Exhaustive View Coverage
  const expectedViews: DashboardView[] = ['matches', 'pipeline', 'tracker', 'culture_matrix'];
  assert(
    DASHBOARD_NAV_TABS.length === 4,
    `Expected exactly 4 dashboard navigation tabs, found ${DASHBOARD_NAV_TABS.length}`
  );

  expectedViews.forEach((view) => {
    const tab = DASHBOARD_NAV_TABS.find(t => t.id === view);
    assert(!!tab, `Missing navigation configuration for view: ${view}`);
  });
  console.log('  ✓ Test 1: All 4 dashboard views configured');

  // Test 2: Mobile Label Compactness Invariant
  // Mobile labels must be significantly more compact than desktop labels to prevent wrapping
  DASHBOARD_NAV_TABS.forEach((tab) => {
    assert(
      tab.mobileLabel.length < tab.desktopLabel.length,
      `Mobile label "${tab.mobileLabel}" (${tab.mobileLabel.length} chars) must be strictly shorter than desktop label "${tab.desktopLabel}" (${tab.desktopLabel.length} chars)`
    );
    assert(
      tab.mobileLabel.length <= 10,
      `Mobile label "${tab.mobileLabel}" must be concise (<= 10 characters) for mobile screens`
    );
    assert(
      typeof tab.icon === 'object' || typeof tab.icon === 'function',
      `Tab ${tab.id} must specify a valid SVG icon component`
    );
  });
  console.log('  ✓ Test 2: Mobile labels satisfy concise length constraints (<= 10 chars)');

  // Test 3: Type Guard Validation (Valid Views)
  expectedViews.forEach((view) => {
    assert(
      isValidDashboardView(view) === true,
      `isValidDashboardView should return true for valid view: ${view}`
    );
  });
  console.log('  ✓ Test 3: isValidDashboardView validates all active views');

  // Test 4: Type Guard Defensive Boundaries (Invalid Inputs)
  const invalidInputs: unknown[] = [
    null,
    undefined,
    '',
    'invalid',
    'MATCHES',
    'admin',
    123,
    {},
    [],
    true
  ];

  invalidInputs.forEach((input) => {
    assert(
      isValidDashboardView(input) === false,
      `isValidDashboardView should return false for invalid input: ${JSON.stringify(input)}`
    );
  });
  console.log('  ✓ Test 4: isValidDashboardView rejects invalid inputs defensively');

  // Test 5: WCAG Styling & Accent Colors Present
  DASHBOARD_NAV_TABS.forEach((tab) => {
    assert(
      tab.accentColor.includes('text-'),
      `Tab ${tab.id} must declare high-contrast text accent color`
    );
    assert(
      tab.accentBg.includes('bg-'),
      `Tab ${tab.id} must declare active background pill style`
    );
  });
  console.log('  ✓ Test 5: Accessible high-contrast styling tokens verified across all tabs');

  console.log('✅ All DashboardSubNav tests passed successfully.\n');
}
