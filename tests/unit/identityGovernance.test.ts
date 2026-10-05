import { normalizeEmail, validateEmail, checkRoleSwitchRateLimit, generateArchiveProfilePath } from '../../src/utils/identityGovernance';

export function runIdentityGovernanceTests() {
  console.log("Starting identityGovernance unit test suite...");

  // 1. Email normalization
  const mixed = "  User.Name+Tag@Example.COM  ";
  const normalized = normalizeEmail(mixed);
  if (normalized !== "user.name+tag@example.com") {
    throw new Error(`Test 1 Failed: Expected lowercase + trim with tag preserved, got ${normalized}`);
  }
  console.log("✓ Test 1: Email normalization trims and lowercases while preserving plus-addressing");

  // 2. Email validation
  if (!validateEmail("alex@company.org")) {
    throw new Error("Test 2 Failed: alex@company.org should be valid");
  }
  if (validateEmail("not-an-email")) {
    throw new Error("Test 3 Failed: not-an-email should be invalid");
  }
  console.log("✓ Test 2-3: RFC 5322 email validation verified");

  // 3. Role switch rate limiting (Max 3 switches in 24 hours)
  const now = Date.now();
  const oneHourAgo = new Date(now - 1 * 60 * 60 * 1000);
  const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000);
  const threeHoursAgo = new Date(now - 3 * 60 * 60 * 1000);

  const historyWith2 = [
    { role: 'jobSeeker' as const, timestamp: twoHoursAgo },
    { role: 'recruiter' as const, timestamp: oneHourAgo }
  ];
  const checkPass = checkRoleSwitchRateLimit(historyWith2);
  if (!checkPass.allowed || checkPass.remaining !== 1) {
    throw new Error(`Test 4 Failed: Expected 1 remaining switch allowed, got ${checkPass.remaining}`);
  }

  const historyWith3 = [
    { role: 'jobSeeker' as const, timestamp: threeHoursAgo },
    { role: 'recruiter' as const, timestamp: twoHoursAgo },
    { role: 'company' as const, timestamp: oneHourAgo }
  ];
  const checkBlock = checkRoleSwitchRateLimit(historyWith3);
  if (checkBlock.allowed !== false) {
    throw new Error("Test 5 Failed: 4th switch in 24h should be blocked");
  }
  if (!checkBlock.retryAfterMs || checkBlock.retryAfterMs <= 0) {
    throw new Error("Test 6 Failed: Expected positive retryAfterMs");
  }
  console.log("✓ Test 4-6: Role switch 24h rate-limiting and throttle calculations verified");

  // 4. Archive profile path generation
  const path = generateArchiveProfilePath('user-123', 'recruiter', 1700000000);
  if (path !== 'users/user-123/profiles/archived/recruiter_1700000000') {
    throw new Error(`Test 7 Failed: Expected archive path, got ${path}`);
  }
  console.log("✓ Test 7: Atomic archive profile path generation verified");

  console.log("All identityGovernance unit tests passed successfully!\n");
}

if (process.argv[1]?.endsWith('identityGovernance.test.ts')) {
  runIdentityGovernanceTests();
}
