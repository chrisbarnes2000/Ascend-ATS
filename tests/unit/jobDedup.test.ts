import { canonicalizeJobUrl, extractJobIdentifier, computeDeterministicHash, isJobStale } from '../../src/utils/jobDedup';

export function runJobDedupTests() {
  console.log("Starting jobDedup unit test suite...");

  // 1. URL Canonicalization tests
  const url1 = "https://www.linkedin.com/jobs/view/3829102938/?utm_source=share&utm_medium=member_desktop";
  const url2 = "http://linkedin.com/jobs/view/3829102938/";
  const c1 = canonicalizeJobUrl(url1);
  const c2 = canonicalizeJobUrl(url2);

  if (c1 !== "https://linkedin.com/jobs/view/3829102938") {
    throw new Error(`Test 1 Failed: Expected stripped params & www, got ${c1}`);
  }
  if (c2 !== "https://linkedin.com/jobs/view/3829102938") {
    throw new Error(`Test 2 Failed: Expected stripped trailing slash, got ${c2}`);
  }
  if (c1 !== c2) {
    throw new Error("Test 3 Failed: Both variations should canonicalize to the same URL");
  }
  console.log("✓ Test 1-3: URL Canonicalization matches expected baseline");

  // 2. Query param preservation (e.g. Indeed jk param)
  const indeedUrl1 = "https://www.indeed.com/viewjob?jk=1a2b3c4d5e6f7a8b&utm_campaign=google_jobs_apply";
  const indeedUrl2 = "https://indeed.com/viewjob?utm_medium=email&jk=1a2b3c4d5e6f7a8b";
  const ic1 = canonicalizeJobUrl(indeedUrl1);
  const ic2 = canonicalizeJobUrl(indeedUrl2);

  if (!ic1.includes("jk=1a2b3c4d5e6f7a8b") || ic1.includes("utm_campaign")) {
    throw new Error(`Test 4 Failed: Expected jk preserved and utm stripped, got ${ic1}`);
  }
  if (ic1 !== ic2) {
    throw new Error(`Test 5 Failed: Canonical Indeed URLs should match, got ${ic1} vs ${ic2}`);
  }
  console.log("✓ Test 4-5: Query param filtering (preserving job IDs, stripping tracking)");

  // 3. Source-specific ID extraction
  const linkedinId = extractJobIdentifier("https://www.linkedin.com/jobs/view/9988776655/");
  if (linkedinId !== "linkedin-9988776655") {
    throw new Error(`Test 6 Failed: Expected linkedin-9988776655, got ${linkedinId}`);
  }

  const indeedId = extractJobIdentifier("https://indeed.com/viewjob?jk=fedcba0987654321");
  if (indeedId !== "indeed-fedcba0987654321") {
    throw new Error(`Test 7 Failed: Expected indeed-fedcba0987654321, got ${indeedId}`);
  }

  const govJobId = extractJobIdentifier("https://www.governmentjobs.com/careers/cityofsf/jobs/4521098");
  if (govJobId !== "governmentjobs-4521098") {
    throw new Error(`Test 8 Failed: Expected governmentjobs-4521098, got ${govJobId}`);
  }

  const greenhouseId = extractJobIdentifier("https://boards.greenhouse.io/acme/jobs/5544332");
  if (greenhouseId !== "greenhouse-5544332") {
    throw new Error(`Test 9 Failed: Expected greenhouse-5544332, got ${greenhouseId}`);
  }
  console.log("✓ Test 6-9: Source-specific ID extraction verified across ATS platforms");

  // 4. Deterministic Hash Fallback (No Date.now())
  const unparseableUrl = "https://example-careers.com/listing/staff-specialist";
  const idA = extractJobIdentifier(unparseableUrl);
  const idB = extractJobIdentifier(unparseableUrl);
  if (idA !== idB) {
    throw new Error("Test 10 Failed: Fallback ID must be deterministic across calls");
  }
  if (idA.includes("ingested-") || idA.length < 10) {
    throw new Error(`Test 11 Failed: ID should be hash-based, got ${idA}`);
  }
  console.log("✓ Test 10-11: Deterministic hash fallback ensures zero timestamp collisions");

  // 5. Stale Job TTL Evaluation
  const now = Date.now();
  const ninetyOneDaysAgo = now - (91 * 24 * 60 * 60 * 1000);
  const tenDaysAgo = now - (10 * 24 * 60 * 60 * 1000);

  if (!isJobStale(ninetyOneDaysAgo, null, 90)) {
    throw new Error("Test 12 Failed: 91-day old job should be marked stale");
  }
  if (isJobStale(tenDaysAgo, null, 90)) {
    throw new Error("Test 13 Failed: 10-day old job should not be marked stale");
  }
  console.log("✓ Test 12-13: 90-day retention TTL evaluation verified");

  console.log("All jobDedup unit tests passed successfully!\n");
}

if (process.argv[1]?.endsWith('jobDedup.test.ts')) {
  runJobDedupTests();
}
