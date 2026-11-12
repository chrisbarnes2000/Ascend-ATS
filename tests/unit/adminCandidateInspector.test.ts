import assert from 'assert';
import { getMatchBreakdown, calculateMatchScore } from '../../src/hooks/useJobMatching';

export function runAdminCandidateInspectorTests() {
  console.log('Starting adminCandidateInspector unit test suite...');

  // Mock candidate profile
  const mockCandidate = {
    personalInfo: { fullName: 'Alice Architect', email: 'alice@example.com' },
    targetRole: 'Staff Frontend Engineer',
    skills: ['TypeScript', 'React', 'Node.js', 'System Design'],
    targetSalary: 150000,
    preferredWorkplaceType: 'Remote',
    workExperience: [
      { title: 'Senior Frontend Engineer', company: 'Tech Corp', skills: ['TypeScript', 'React'] }
    ],
    targetBenefits: ['Health Insurance', '401(k) Matching']
  } as any;

  // Mock matching job requisition
  const matchingJob = {
    id: 'job_101',
    title: 'Staff Frontend Engineer',
    company: 'Innovate Tech',
    description: 'We are seeking a Staff Frontend Engineer proficient in React, TypeScript, Node.js, and System Design. $140k - $170k salary. Remote position.',
    workplaceType: 'Remote',
    parsedCriteria: {
      skills: ['TypeScript', 'React', 'Node.js', 'System Design'],
      salaryRange: { min: 140000, max: 170000 },
      workplaceType: 'Remote',
      minExperience: 5
    }
  } as any;

  // Test 1: Ground-truth match calculation for high-fit candidate
  const breakdown = getMatchBreakdown(mockCandidate, matchingJob);
  assert.strictEqual(breakdown.overallScore >= 75, true, 'Matching profile score should be >= 75%');
  assert.strictEqual(breakdown.skillsMatch.matchedCount >= 3, true, 'At least 3 skills should match');
  assert.strictEqual(breakdown.salaryMatch.isMatch, true, 'Salary range should match candidate target');
  assert.strictEqual(breakdown.workplaceMatch.isMatch, true, 'Workplace setting should match');
  console.log('✓ Test 1: High match score breakdown calculated correctly');

  // Test 2: Low-match detection & diff debugging
  const mismatchedJob = {
    id: 'job_999',
    title: 'Senior Clinical Research Associate',
    company: 'BioPharma Global',
    description: 'Lead clinical trials, GCP compliance, and patient monitoring. BSN/MSN required. On-Site 5 days/week in Boston, MA. $80k - $95k salary.',
    workplaceType: 'On-Site',
    parsedCriteria: {
      skills: ['Clinical Trials', 'GCP', 'Phlebotomy', 'Patient Care'],
      salaryRange: { min: 80000, max: 95000 },
      workplaceType: 'On-Site',
      minExperience: 4
    }
  } as any;

  const lowBreakdown = getMatchBreakdown(mockCandidate, mismatchedJob);
  assert.strictEqual(lowBreakdown.overallScore < 60, true, 'Mismatched job score must be < 60%');
  assert.strictEqual(lowBreakdown.salaryMatch.isMatch, false, 'Salary gap must be flagged');
  assert.strictEqual(lowBreakdown.workplaceMatch.isMatch, false, 'Setting mismatch must be flagged');
  assert.strictEqual(lowBreakdown.skillsMatch.requiredMissing.length > 0, true, 'Missing required skills list must be populated');
  console.log('✓ Test 2: Low-match diff debugging and missing skill analysis verified');

  console.log('All adminCandidateInspector unit tests passed successfully!');
}
