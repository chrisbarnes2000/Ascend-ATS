import { JobSeekerProfile, WorkExperience, Education } from '../types';

export function parseSalary(salaryStr: string | undefined): number {
  if (!salaryStr) return 0;
  // Match digits with optional 'K' or 'M'
  const cleanStr = salaryStr.replace(/,/g, '');
  const match = cleanStr.match(/\$?(\d+)\s*K?/i);
  if (match) {
    let val = parseInt(match[1]);
    if (cleanStr.toLowerCase().includes('k')) {
      val *= 1000;
    }
    return val;
  }
  return 0;
}

export function parseJsonProfile(rawJson: any): Partial<JobSeekerProfile> {
  const personalInfo = rawJson.personal_info || {};
  const profIdentity = rawJson.professional_identity || {};
  const competencies = rawJson.core_competencies || {};
  const salaryBenefits = rawJson.salary_and_benefits_expectations || {};

  // Extract first and last names from personal_info.name
  const fullName = personalInfo.name || '';
  const nameParts = fullName.trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  // Gather skills from technical_skills
  const skillsSet = new Set<string>();
  if (competencies.technical_skills) {
    const tech = competencies.technical_skills;
    
    // Helper to add strings/arrays to the set
    const addSkills = (items: any) => {
      if (Array.isArray(items)) {
        items.forEach(item => {
          if (typeof item === 'string') skillsSet.add(item);
        });
      } else if (items && typeof items === 'object') {
        Object.values(items).forEach(val => addSkills(val));
      } else if (typeof items === 'string') {
        skillsSet.add(items);
      }
    };

    addSkills(tech.cloud_and_infrastructure);
    addSkills(tech.ci_cd);
    addSkills(tech.monitoring_and_logging);
    addSkills(tech.programming);
    addSkills(tech.databases);
    addSkills(tech.financial_tools);
  }

  // Fallbacks for general skills if technical_skills is not found
  if (Array.isArray(competencies.soft_skills)) {
    competencies.soft_skills.forEach((s: string) => skillsSet.add(s));
  }
  if (Array.isArray(competencies.mission_driven_skills)) {
    competencies.mission_driven_skills.forEach((s: string) => skillsSet.add(s));
  }

  // Work experience mapping
  const workExperience: WorkExperience[] = [];
  if (Array.isArray(rawJson.work_experience)) {
    rawJson.work_experience.forEach((item: any) => {
      const dates = item.dates || '';
      const parts = dates.split(/[–-]/);
      const startDate = parts[0]?.trim() || '';
      const endDate = parts[1]?.trim() || 'Present';

      // Build a comprehensive description including achievements
      let description = item.description || '';
      if (Array.isArray(item.key_achievements) && item.key_achievements.length > 0) {
        const bulletPoints = item.key_achievements.map((ach: string) => `• ${ach}`).join('\n');
        description = description ? `${description}\n\nKey Achievements:\n${bulletPoints}` : bulletPoints;
      }

      workExperience.push({
        company: item.company || '',
        role: item.role || '',
        startDate,
        endDate,
        description,
        skills: []
      });
    });
  }

  // Education mapping
  const education: Education[] = [];
  if (Array.isArray(rawJson.education)) {
    rawJson.education.forEach((item: any) => {
      education.push({
        institution: item.institution || '',
        degree: item.degree || '',
        field: item.degree || '', // Default field to degree
        graduationDate: item.dates || ''
      });
    });
  }

  // Target preferences
  const targetRole = personalInfo.preferred_title || (salaryBenefits.target_roles && salaryBenefits.target_roles[0]) || '';
  const targetSalary = parseSalary(salaryBenefits.salary_range);
  const rawBenefits = salaryBenefits.benefits || salaryBenefits.preferred_benefits || [];
  const targetBenefits = Array.isArray(rawBenefits) ? rawBenefits.map((b: any) => String(b)) : [];

  return {
    personalInfo: {
      firstName,
      lastName,
      phone: personalInfo.phone || '',
      location: personalInfo.current_location || '',
      linkedinUrl: personalInfo.linkedin || '',
      portfolioUrl: personalInfo.portfolio || personalInfo.github || ''
    },
    professionalSummary: profIdentity.narrative || '',
    targetRole,
    targetSalary,
    targetBenefits,
    workExperience,
    education,
    skills: Array.from(skillsSet).map(s => ({ name: s as string })),
    resumes: [],
    privacy: {
      isPublic: false,
      searchable: true,
      redactPii: false,
      excludedCompanies: [],
      excludedIndustries: [],
      privacyLevel: 1
    },
    parsedData: rawJson // Save original rich JSON structure
  };
}
