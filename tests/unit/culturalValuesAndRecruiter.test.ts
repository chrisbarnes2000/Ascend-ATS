import { 
  FAST_COMPANY_26_VALUES, 
  MANPOWER_5_RECRUITER_KEYS 
} from '../../src/data/culturalValuesCatalog';
import { detectMaterialShifts } from '../../src/utils/materialShiftEngine';
import { calculateMatchScore, getMatchBreakdown } from '../../src/hooks/useJobMatching';
import { Job, JobSeekerProfile } from '../../src/types';

export function runCulturalValuesAndRecruiterTests(): void {
  console.log('🧪 [TEST] Running Cultural Values & Recruiter Partnership Unit Tests...');

  // Test 1: Fast Company 26 Catalog Integrity
  if (FAST_COMPANY_26_VALUES.length !== 26) {
    throw new Error(`Expected 26 Fast Company values, got ${FAST_COMPANY_26_VALUES.length}`);
  }
  FAST_COMPANY_26_VALUES.forEach(val => {
    if (!val.id || !val.title || !val.reverseInterviewQuestion || !val.redFlagPhrase) {
      throw new Error(`Missing required fields on cultural value ID: ${val.id}`);
    }
  });
  console.log('  ✅ 1. Fast Company 26 Cultural Values Catalog validated (100% complete)');

  // Test 2: Manpower 5 Keys Catalog Integrity
  if (MANPOWER_5_RECRUITER_KEYS.length !== 5) {
    throw new Error(`Expected 5 Manpower recruiter keys, got ${MANPOWER_5_RECRUITER_KEYS.length}`);
  }
  MANPOWER_5_RECRUITER_KEYS.forEach(key => {
    if (!key.id || !key.title || key.candidateActionableTips.length === 0) {
      throw new Error(`Missing required fields on recruiter key ID: ${key.id}`);
    }
  });
  console.log('  ✅ 2. Manpower 5 Keys Recruiter Partnership Catalog validated');

  // Test 3: Material Shift Cultural Red Flag Detection
  const jobWithRedFlags: Partial<Job> = {
    title: 'Senior Developer',
    description: 'We are a family here and work hard play hard with relentless hustle!',
    requirements: 'Must deliver without complaining.'
  };

  const shiftEval = detectMaterialShifts(null, jobWithRedFlags);
  const redFlagShifts = shiftEval.shifts.filter(s => s.description.includes('Red Flag'));
  if (redFlagShifts.length < 3) {
    throw new Error(`Expected at least 3 cultural red flag shifts, found ${redFlagShifts.length}`);
  }
  console.log(`  ✅ 3. Material Shift Engine detected ${redFlagShifts.length} cultural red flags`);

  // Test 4: Cultural Value Match Bonus Calculation
  const mockProfile: JobSeekerProfile = {
    personalInfo: { firstName: 'Jane', lastName: 'Doe' },
    professionalSummary: 'Senior Systems Engineer',
    targetRole: 'Senior Developer',
    targetSalary: 150000,
    workExperience: [],
    education: [],
    skills: [{ name: 'TypeScript' }, { name: 'React' }],
    resumes: [],
    privacy: { isPublic: true, searchable: true, redactPii: false, excludedCompanies: [], excludedIndustries: [] },
    culturalPreferences: ['originality', 'excellence_empathy', 'uncomfortable_transparency']
  };

  const mockJobWithoutCulture: Job = {
    id: 'job-1',
    companyId: 'comp-1',
    companyName: 'TechCorp',
    title: 'Senior Developer',
    description: 'TypeScript React engineer',
    requirements: 'TypeScript React',
    salaryMin: 140000,
    salaryMax: 160000,
    status: 'active',
    createdAt: new Date()
  };

  const mockJobWithCulture: Job = {
    ...mockJobWithoutCulture,
    culturalValuesPillars: ['originality', 'excellence_empathy', 'uncomfortable_transparency']
  };

  const scoreBase = calculateMatchScore(mockProfile, mockJobWithoutCulture);
  const scoreWithCulture = calculateMatchScore(mockProfile, mockJobWithCulture);

  if (scoreWithCulture <= scoreBase) {
    throw new Error(`Expected cultural alignment bonus to increase score: base ${scoreBase} vs culture ${scoreWithCulture}`);
  }
  console.log(`  ✅ 4. Match Score Engine applied cultural alignment bonus (${scoreBase} -> ${scoreWithCulture})`);

  // Test 5: Match Breakdown Reason Formatting
  const breakdown = getMatchBreakdown(mockProfile, mockJobWithCulture);
  const cultureReason = breakdown.reasons.find(r => r.includes('Culture-Add Alignment'));
  if (!cultureReason) {
    throw new Error('Expected "Culture-Add Alignment" reason in match breakdown');
  }
  console.log(`  ✅ 5. Match Breakdown generated culture-add reason: "${cultureReason}"`);

  // Test 6: GovJobs Outreach Manager Extraction Regex Verification
  const sampleGovJobText = `
  Selection Process & Supplemental Information
  This recruitment is being managed by Kye Merritt, if you would like to be notified of similar opportunities or stay connected with things going on at Tacoma Public Utilities and the City of Tacoma, connect with me on [LinkedIn](https://www.linkedin.com/in/kyemerritt/)!
  `;
  const managedByRegex = /(?:managed by|contact|reach out to|recruitment is being managed by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i;
  const matchName = sampleGovJobText.match(managedByRegex);
  if (!matchName || matchName[1] !== 'Kye Merritt') {
    throw new Error(`Expected GovJobs outreach name regex to parse "Kye Merritt", got: ${matchName ? matchName[1] : 'null'}`);
  }

  const linkedinRegex = /https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i;
  const matchLI = sampleGovJobText.match(linkedinRegex);
  if (!matchLI || matchLI[0] !== 'https://www.linkedin.com/in/kyemerritt') {
    throw new Error(`Expected GovJobs outreach LinkedIn regex to parse profile URL, got: ${matchLI ? matchLI[0] : 'null'}`);
  }
  console.log('  ✅ 6. GovJobs outreach manager and LinkedIn URL regex extraction verified');

  console.log('🎉 [TEST] All Cultural Values & Recruiter Partnership unit tests PASSED!');
}
