import { detectMaterialShifts, calculateSemanticVersion } from '../../src/utils/materialShiftEngine';
import { Job } from '../../src/types';

export function runMaterialShiftTests() {
  console.log("Starting materialShiftEngine unit test suite...");

  const baseJob: Partial<Job> = {
    title: 'Senior Software Engineer',
    salaryMin: 120000,
    salaryMax: 160000,
    requirements: '5+ years building distributed applications in TypeScript and React. Experience with Cloud SQL.',
    workplaceType: 'Remote',
    currentVersion: 'v1.0.0',
    nefariousRiskScore: 0,
    revisions: []
  };

  // 1. Max Salary Drop (> 5% triggers high_bait_and_switch)
  const salaryDropJob: Partial<Job> = {
    ...baseJob,
    salaryMax: 140000 // 160K -> 140K is 12.5% drop (>5%)
  };
  const eval1 = detectMaterialShifts(baseJob, salaryDropJob);

  if (eval1.flaggedRiskLevel !== 'high_bait_and_switch') {
    throw new Error(`Test 1 Failed: Expected high_bait_and_switch, got ${eval1.flaggedRiskLevel}`);
  }
  if (eval1.riskScoreIncrease < 40) {
    throw new Error(`Test 2 Failed: Expected at least 40 risk score increase, got ${eval1.riskScoreIncrease}`);
  }
  if (!eval1.nextVersionNumber.startsWith('v2.')) {
    throw new Error(`Test 3 Failed: High risk should trigger major version bump, got ${eval1.nextVersionNumber}`);
  }
  console.log("✓ Test 1-3: Max salary drop bait-and-switch detection and major version bump verified");

  // 2. Workplace shift: Remote to On-Site
  const workplaceShiftJob: Partial<Job> = {
    ...baseJob,
    workplaceType: 'On-Site'
  };
  const eval2 = detectMaterialShifts(baseJob, workplaceShiftJob);

  if (eval2.flaggedRiskLevel !== 'high_bait_and_switch') {
    throw new Error(`Test 4 Failed: Remote to On-site should be high risk, got ${eval2.flaggedRiskLevel}`);
  }
  const wpShift = eval2.shifts.find(s => s.field === 'workplaceType');
  if (!wpShift || !wpShift.description.includes('Remote ➔ On-Site')) {
    throw new Error("Test 5 Failed: Expected workplace shift description");
  }
  console.log("✓ Test 4-5: Remote to On-site bait-and-switch detection verified");

  // 3. Seniority Downgrade in Title: Senior to Junior
  const titleDowngradeJob: Partial<Job> = {
    ...baseJob,
    title: 'Junior Software Engineer'
  };
  const eval3 = detectMaterialShifts(baseJob, titleDowngradeJob);
  const titleShift = eval3.shifts.find(s => s.field === 'title');
  if (!titleShift || titleShift.severity !== 'high_bait_and_switch') {
    throw new Error("Test 6 Failed: Seniority downgrade should be flagged as high severity");
  }
  console.log("✓ Test 6: Seniority downgrade detection verified");

  // 4. Requirements Scope Expansion (>20%)
  const longScopeJob: Partial<Job> = {
    ...baseJob,
    requirements: baseJob.requirements + ' Must also have 10 years Kubernetes, Docker, Terraform, Rust, Go, Python, Machine Learning, Deep Neural Networks, CUDA kernel tuning, and 24/7 pager duty rotation.'
  };
  const eval4 = detectMaterialShifts(baseJob, longScopeJob);
  const reqShift = eval4.shifts.find(s => s.field === 'requirements');
  if (!reqShift || reqShift.severity !== 'moderate') {
    throw new Error("Test 7 Failed: Expected moderate severity for scope creep");
  }
  console.log("✓ Test 7: Scope expansion detection verified");

  // 5. Minor / Non-material typo fix -> Patch bump
  const typoFixJob: Partial<Job> = {
    ...baseJob,
    requirements: baseJob.requirements?.replace('applications', 'web applications')
  };
  const eval5 = detectMaterialShifts(baseJob, typoFixJob);
  if (eval5.flaggedRiskLevel !== 'low') {
    throw new Error("Test 8 Failed: Minor edit should have low risk level");
  }
  if (eval5.nextVersionNumber !== 'v1.0.1') {
    throw new Error(`Test 9 Failed: Minor edit should bump patch version to v1.0.1, got ${eval5.nextVersionNumber}`);
  }
  console.log("✓ Test 8-9: Minor/typo edit produces patch version bump without penalty");

  console.log("All materialShiftEngine unit tests passed successfully!\n");
}

if (process.argv[1]?.endsWith('materialShiftEngine.test.ts')) {
  runMaterialShiftTests();
}
