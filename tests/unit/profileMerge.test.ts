import { mergeSkills, mergeWorkExperience, mergeEducation, mergeProfileData } from '../../src/utils/profileMerge';
import { JobSeekerProfile, ProfileSkill, WorkExperience, Education } from '../../src/types';

export function runProfileMergeTests() {
  console.log("Starting profileMerge unit test suite...");

  // 1. Skill Array Union & Case-Insensitive Dedup
  const existingSkills: ProfileSkill[] = [
    { name: 'TypeScript', level: 'Advanced', years: 4 },
    { name: 'React', level: 'Intermediate', years: 2 }
  ];
  const incomingSkills: ProfileSkill[] = [
    { name: 'typescript', level: 'Expert', years: 6 },
    { name: 'Node.js', level: 'Advanced', years: 3 }
  ];

  const mergedSkills = mergeSkills(existingSkills, incomingSkills);
  if (mergedSkills.length !== 3) {
    throw new Error(`Test 1 Failed: Expected 3 unique skills, got ${mergedSkills.length}`);
  }
  const tsSkill = mergedSkills.find(s => s.name.toLowerCase() === 'typescript');
  if (!tsSkill || tsSkill.years !== 6) {
    throw new Error(`Test 2 Failed: Expected years to upgrade to 6, got ${tsSkill?.years}`);
  }
  console.log("✓ Test 1-2: Skill union and metadata preservation verified");

  // 2. Work Experience Matching & Merging
  const existingExp: WorkExperience[] = [
    {
      company: 'Acme Corp',
      role: 'Staff Engineer',
      startDate: '2022',
      endDate: 'Present',
      description: 'Led architecture for real-time services.',
      skills: ['TypeScript']
    }
  ];
  const incomingExp: WorkExperience[] = [
    {
      company: 'acme corp',
      role: 'staff engineer',
      startDate: '2022',
      endDate: 'Present',
      description: 'Led architecture for real-time services and high throughput messaging pipelines.',
      skills: ['TypeScript', 'Kafka']
    },
    {
      company: 'Beta Systems',
      role: 'Senior Developer',
      startDate: '2019',
      endDate: '2022',
      description: 'Built APIs.',
      skills: ['PostgreSQL']
    }
  ];

  const mergedExp = mergeWorkExperience(existingExp, incomingExp);
  if (mergedExp.length !== 2) {
    throw new Error(`Test 3 Failed: Expected 2 experiences, got ${mergedExp.length}`);
  }
  if (!mergedExp[0].description.includes('high throughput messaging')) {
    throw new Error("Test 4 Failed: Expected longer, richer description to be retained");
  }
  if (!mergedExp[0].skills.includes('Kafka')) {
    throw new Error("Test 5 Failed: Expected merged skills to include Kafka");
  }
  console.log("✓ Test 3-5: Work experience deduplication and enrichment verified");

  // 3. Deep Profile Merge - Overrides Preservation
  const existingProfile: JobSeekerProfile = {
    personalInfo: {
      firstName: 'Alex',
      lastName: 'Taylor',
      phone: '+1 (555) 999-1234',
      location: 'San Francisco, CA',
      pronouns: 'they/them'
    },
    professionalSummary: 'Original summary',
    targetRole: 'Senior Architect',
    targetSalary: 180000,
    skills: existingSkills,
    workExperience: existingExp,
    education: [],
    resumes: [{ url: 'https://example.com/cv.pdf', name: 'cv.pdf', uploadedAt: new Date() }],
    privacy: {
      isPublic: true,
      searchable: false,
      redactPii: true,
      excludedCompanies: ['BadCompany Inc'],
      excludedIndustries: ['Gambling'],
      privacyLevel: 3
    },
    sectionOrder: ['experience', 'skills', 'education', 'accommodations'],
    deiAndAccommodations: {
      needsAccommodations: true,
      accommodationDetails: 'Sensory calm workspace requested.',
      accommodationTypes: ['Quiet Workspace'],
      shareDeiWithEmployers: true
    }
  };

  const incomingParsed: Partial<JobSeekerProfile> = {
    personalInfo: {
      firstName: 'Alexander',
      lastName: 'Taylor'
      // phone and location omitted in incoming resume
    },
    professionalSummary: 'Updated professional narrative with new achievements.',
    skills: incomingSkills,
    workExperience: incomingExp
  };

  const mergedProfile = mergeProfileData(existingProfile, incomingParsed, 'merge');

  // Verify user overrides survived intact
  if (mergedProfile.personalInfo.phone !== '+1 (555) 999-1234') {
    throw new Error(`Test 6 Failed: Custom phone was lost in merge, got ${mergedProfile.personalInfo.phone}`);
  }
  if (mergedProfile.privacy.privacyLevel !== 3 || mergedProfile.privacy.redactPii !== true) {
    throw new Error("Test 7 Failed: Privacy settings were altered in merge");
  }
  if (mergedProfile.sectionOrder?.[0] !== 'experience') {
    throw new Error("Test 8 Failed: Custom section order was altered in merge");
  }
  if (mergedProfile.deiAndAccommodations?.needsAccommodations !== true) {
    throw new Error("Test 9 Failed: DEI accommodations were lost in merge");
  }
  if (mergedProfile.skills.length !== 3) {
    throw new Error(`Test 10 Failed: Expected 3 merged skills, got ${mergedProfile.skills.length}`);
  }
  console.log("✓ Test 6-10: Complete user override preservation verified during re-upload");

  console.log("All profileMerge unit tests passed successfully!\n");
}

if (process.argv[1]?.endsWith('profileMerge.test.ts')) {
  runProfileMergeTests();
}
