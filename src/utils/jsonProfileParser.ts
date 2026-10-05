import { JobSeekerProfile, WorkExperience, Education } from '../types';
import { STATIC_CONFIG } from '../config';

export interface NormalizedSalary {
  min: number;
  max: number;
  currency: string;
}

/**
 * Normalizes salary representations (e.g. "$120K - $150K", "$135,000", "150K+", "1.2M").
 * Complies with Section 6.2 of Dedup/Validation/Merge spec.
 */
export function normalizeSalary(salaryStr: string | undefined): NormalizedSalary | null {
  if (!salaryStr || typeof salaryStr !== 'string') return null;

  const clean = salaryStr.trim().replace(/,/g, '');
  if (!clean) return null;

  // Detect currency
  let currency = 'USD';
  if (clean.includes('€')) currency = 'EUR';
  else if (clean.includes('£')) currency = 'GBP';
  else if (clean.includes('CAD')) currency = 'CAD';

  // Range matching e.g. "$120K - $150K" or "100000 - 140000"
  const rangeMatch = clean.match(/\$?(\d+(?:\.\d+)?)\s*([kKmM])?\s*(?:–|-|to)\s*\$?(\d+(?:\.\d+)?)\s*([kKmM])?/i);
  if (rangeMatch) {
    let min = parseFloat(rangeMatch[1]);
    const minUnit = (rangeMatch[2] || rangeMatch[4] || '').toUpperCase();
    if (minUnit === 'K') min *= 1000;
    else if (minUnit === 'M') min *= 1000000;

    let max = parseFloat(rangeMatch[3]);
    const maxUnit = (rangeMatch[4] || rangeMatch[2] || '').toUpperCase();
    if (maxUnit === 'K') max *= 1000;
    else if (maxUnit === 'M') max *= 1000000;

    return { min: Math.round(min), max: Math.round(max), currency };
  }

  // Single value e.g. "$120K+", "$135,000"
  const singleMatch = clean.match(/\$?(\d+(?:\.\d+)?)\s*([kKmM])?/i);
  if (singleMatch) {
    let val = parseFloat(singleMatch[1]);
    const unit = (singleMatch[2] || '').toUpperCase();
    if (unit === 'K') val *= 1000;
    else if (unit === 'M') val *= 1000000;
    const rounded = Math.round(val);
    return { min: rounded, max: rounded, currency };
  }

  return null;
}

export function parseSalary(salaryStr: string | undefined): number {
  const normalized = normalizeSalary(salaryStr);
  if (!normalized) return 0;
  return normalized.max || normalized.min || 0;
}

/**
 * Sanitizes generic string inputs (stripping control chars, trimming, enforcing max length).
 */
export function sanitizeString(val: any, maxLength = 200): string {
  if (val === null || val === undefined) return '';
  const str = String(val).replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
  return str.slice(0, maxLength);
}

/**
 * Sanitizes phone numbers preserving optional leading plus and digits.
 */
export function sanitizePhone(val: any): string {
  if (!val) return '';
  const str = String(val).trim();
  const leadingPlus = str.startsWith('+') ? '+' : '';
  const digits = str.replace(/\D/g, '');
  return `${leadingPlus}${digits}`.slice(0, 25);
}

/**
 * Sanitizes narrative / multiline text, preserving newlines and safe punctuation.
 */
export function sanitizeNarrative(val: any, maxLength = 5000): string {
  if (val === null || val === undefined) return '';
  const str = String(val).replace(/[\u0000-\u0009\u000B-\u001F\u007F-\u009F]/g, '').trim();
  return str.slice(0, maxLength);
}

export function parseJsonProfile(rawJson: any): Partial<JobSeekerProfile> {
  if (!rawJson || typeof rawJson !== 'object') {
    return {
      personalInfo: { firstName: '', lastName: '' },
      professionalSummary: '',
      targetRole: '',
      targetSalary: 0,
      skills: [],
      workExperience: [],
      education: []
    };
  }

  // Schema Flavor Detection Precedence (Section 6.1)
  // 1. Advanced Persona > 2. Recruiter Profile > 3. Simplified Resume > 4. Legacy Flat Format
  const isAdvancedPersona = Boolean(rawJson?.persona);
  const isRecruiter = !isAdvancedPersona && Boolean(rawJson?.recruiter_info || rawJson?.organization);
  const isSimplified = !isAdvancedPersona && !isRecruiter && Boolean(rawJson?.contact && (rawJson?.summary || rawJson?.work_experience || rawJson?.skills));
  const isLegacy = !isAdvancedPersona && !isRecruiter && !isSimplified;

  let firstName = '';
  let lastName = '';
  let preferredName = '';
  let pronouns = '';
  let phone = '';
  let location = '';
  let linkedinUrl = '';
  let portfolioUrl = '';
  let professionalSummary = '';
  let targetRole = '';
  let targetSalary = 0;
  let targetBenefits: string[] = [];
  const skillsSet = new Set<string>();
  const workExperience: WorkExperience[] = [];
  const education: Education[] = [];
  let needsAccommodations = false;
  let accommodationDetails = '';
  const accommodationTypes: string[] = [];

  const addSkills = (items: any) => {
    if (!items || skillsSet.size >= STATIC_CONFIG.SAFETY_LIMITS.MAX_ARRAY_ITEMS) return;
    if (Array.isArray(items)) {
      items.forEach(item => {
        if (typeof item === 'string' && item.trim()) {
          skillsSet.add(sanitizeString(item.trim(), 80));
        }
      });
    } else if (typeof items === 'object') {
      Object.values(items).forEach(val => addSkills(val));
    } else if (typeof items === 'string' && items.trim()) {
      skillsSet.add(sanitizeString(items.trim(), 80));
    }
  };

  if (isAdvancedPersona) {
    const p = rawJson.persona;
    const identity = p.identity || {};
    const contact = p.contact || {};
    const brand = p.brand || {};
    const profIdentity = p.professional_identity || {};
    const salaryBenefits = p.salary_and_benefits_expectations || {};
    const jobPrefs = p.job_preferences || {};
    const accommodations = p.accommodations || {};

    const fullName = identity.name || '';
    const nameParts = fullName.trim().split(/\s+/);
    firstName = nameParts[0] || '';
    lastName = nameParts.slice(1).join(' ') || '';
    pronouns = identity.pronouns || '';
    phone = contact.phone || '';
    location = identity.location || '';
    linkedinUrl = contact.linkedin || '';
    portfolioUrl = contact.portfolio || contact.website || contact.github || '';

    professionalSummary = profIdentity.narrative || brand.elevator_pitch || brand.hero_tagline || '';
    targetRole = (salaryBenefits.target_roles && salaryBenefits.target_roles[0]) || identity.preferred_title || '';
    targetSalary = parseSalary(salaryBenefits.salary_range || jobPrefs.salary_expectations);
    
    if (Array.isArray(salaryBenefits.desired_benefits)) {
      targetBenefits = salaryBenefits.desired_benefits.map((b: any) => String(b));
    }

    addSkills(p.skills);

    if (Array.isArray(p.work_experience)) {
      p.work_experience.forEach((item: any) => {
        let description = item.description || '';
        if (Array.isArray(item.highlights) && item.highlights.length > 0) {
          const bullets = item.highlights.map((h: string) => `• ${h}`).join('\n');
          description = description ? `${description}\n\nKey Achievements:\n${bullets}` : bullets;
        }
        const dates = item.dates || '';
        const parts = dates.split(/[–-]/);
        workExperience.push({
          company: item.company || '',
          role: item.role || '',
          startDate: parts[0]?.trim() || '',
          endDate: parts[1]?.trim() || (item.current ? 'Present' : ''),
          description,
          skills: []
        });
      });
    }

    if (Array.isArray(p.education)) {
      p.education.forEach((item: any) => {
        education.push({
          institution: item.institution || '',
          degree: item.degree || '',
          field: item.degree || '',
          graduationDate: item.dates || ''
        });
      });
    }

    if (accommodations.summary || accommodations.disclosure || accommodations.working_style_preferences?.length) {
      needsAccommodations = true;
      accommodationDetails = [
        accommodations.summary,
        accommodations.disclosure,
        ...(Array.isArray(accommodations.working_style_preferences) ? accommodations.working_style_preferences : [])
      ].filter(Boolean).join('\n• ');
    }

  } else if (isSimplified) {
    const contact = rawJson.contact || {};
    const summary = rawJson.summary || {};
    const opt = rawJson.optional || {};
    const jobPrefs = opt.job_preferences || {};
    const accommodations = opt.accommodations || {};

    const fullName = contact.name || '';
    const nameParts = fullName.trim().split(/\s+/);
    firstName = nameParts[0] || '';
    lastName = nameParts.slice(1).join(' ') || '';
    pronouns = contact.pronouns || '';
    phone = contact.phone || '';
    location = contact.location || '';
    linkedinUrl = contact.linkedin || '';
    portfolioUrl = contact.portfolio || contact.github || '';

    professionalSummary = summary.narrative || summary.headline || '';
    targetRole = summary.target_role || contact.preferred_title || '';
    targetSalary = parseSalary(jobPrefs.salary_expectations);

    addSkills(rawJson.skills);

    if (Array.isArray(rawJson.work_experience)) {
      rawJson.work_experience.forEach((item: any) => {
        let description = item.description || '';
        if (Array.isArray(item.highlights) && item.highlights.length > 0) {
          const bullets = item.highlights.map((h: string) => `• ${h}`).join('\n');
          description = description ? `${description}\n\nKey Achievements:\n${bullets}` : bullets;
        }
        const dates = item.dates || '';
        const parts = dates.split(/[–-]/);
        workExperience.push({
          company: item.company || '',
          role: item.role || '',
          startDate: parts[0]?.trim() || '',
          endDate: parts[1]?.trim() || (item.current ? 'Present' : ''),
          description,
          skills: []
        });
      });
    }

    if (Array.isArray(rawJson.education)) {
      rawJson.education.forEach((item: any) => {
        education.push({
          institution: item.institution || '',
          degree: item.degree || '',
          field: item.degree || '',
          graduationDate: item.dates || ''
        });
      });
    }

    if (accommodations.summary || accommodations.working_style_preferences?.length) {
      needsAccommodations = true;
      accommodationDetails = [
        accommodations.summary,
        ...(Array.isArray(accommodations.working_style_preferences) ? accommodations.working_style_preferences : [])
      ].filter(Boolean).join('\n• ');
    }

  } else if (isRecruiter) {
    const rec = rawJson.recruiter_info || {};
    const org = rawJson.organization || {};
    const bio = rawJson.professional_bio || {};

    firstName = rec.first_name || '';
    lastName = rec.last_name || '';
    phone = rec.phone || '';
    location = rec.location || '';
    linkedinUrl = rec.linkedin || '';
    portfolioUrl = rec.calendly_url || org.website || '';
    targetRole = rec.title || 'Technical Recruiter';
    professionalSummary = bio.summary || bio.sourcing_philosophy || '';

    addSkills(rawJson.sourcing_specialties);

    if (org.company_name) {
      workExperience.push({
        company: org.company_name,
        role: rec.title || 'Technical Recruiter',
        startDate: '2020',
        endDate: 'Present',
        description: `${org.description || ''}\n\nSourcing Philosophy: ${bio.sourcing_philosophy || ''}`,
        skills: []
      });
    }

  } else {
    // Legacy format fallback
    const personalInfo = rawJson.personal_info || {};
    const profIdentity = rawJson.professional_identity || {};
    const competencies = rawJson.core_competencies || {};
    const salaryBenefits = rawJson.salary_and_benefits_expectations || {};

    const fullName = personalInfo.name || '';
    const nameParts = fullName.trim().split(/\s+/);
    firstName = nameParts[0] || '';
    lastName = nameParts.slice(1).join(' ') || '';
    phone = personalInfo.phone || '';
    location = personalInfo.current_location || '';
    linkedinUrl = personalInfo.linkedin || '';
    portfolioUrl = personalInfo.portfolio || personalInfo.github || '';

    addSkills(competencies.technical_skills);
    addSkills(competencies.soft_skills);
    addSkills(competencies.mission_driven_skills);

    if (Array.isArray(rawJson.work_experience)) {
      rawJson.work_experience.forEach((item: any) => {
        const dates = item.dates || '';
        const parts = dates.split(/[–-]/);
        let description = item.description || '';
        if (Array.isArray(item.key_achievements) && item.key_achievements.length > 0) {
          const bullets = item.key_achievements.map((ach: string) => `• ${ach}`).join('\n');
          description = description ? `${description}\n\nKey Achievements:\n${bullets}` : bullets;
        }

        workExperience.push({
          company: item.company || '',
          role: item.role || '',
          startDate: parts[0]?.trim() || '',
          endDate: parts[1]?.trim() || 'Present',
          description,
          skills: []
        });
      });
    }

    if (Array.isArray(rawJson.education)) {
      rawJson.education.forEach((item: any) => {
        education.push({
          institution: item.institution || '',
          degree: item.degree || '',
          field: item.degree || '',
          graduationDate: item.dates || ''
        });
      });
    }

    targetRole = personalInfo.preferred_title || (salaryBenefits.target_roles && salaryBenefits.target_roles[0]) || '';
    targetSalary = parseSalary(salaryBenefits.salary_range);
    const rawBenefits = salaryBenefits.benefits || salaryBenefits.preferred_benefits || [];
    targetBenefits = Array.isArray(rawBenefits) ? rawBenefits.map((b: any) => String(b)) : [];
    needsAccommodations = !!rawJson.accommodations_request;
  }

  return {
    personalInfo: {
      firstName: sanitizeString(firstName, 100),
      lastName: sanitizeString(lastName, 100),
      preferredName: preferredName ? sanitizeString(preferredName, 100) : undefined,
      pronouns: pronouns ? sanitizeString(pronouns, 50) : undefined,
      phone: phone ? sanitizePhone(phone) : undefined,
      location: location ? sanitizeString(location, 200) : undefined,
      linkedinUrl: linkedinUrl ? sanitizeString(linkedinUrl, 500) : undefined,
      portfolioUrl: portfolioUrl ? sanitizeString(portfolioUrl, 500) : undefined
    },
    professionalSummary: sanitizeNarrative(professionalSummary, 5000),
    targetRole: sanitizeString(targetRole, 150),
    targetSalary,
    targetBenefits: targetBenefits.slice(0, 50).map(b => sanitizeString(b, 100)),
    workExperience: workExperience.slice(0, 50).map(w => ({
      ...w,
      company: sanitizeString(w.company, 150),
      role: sanitizeString(w.role, 150),
      description: sanitizeNarrative(w.description, 3000),
      skills: (w.skills || []).slice(0, 50).map(s => sanitizeString(s, 80))
    })),
    education: education.slice(0, 30).map(ed => ({
      institution: sanitizeString(ed.institution, 150),
      degree: sanitizeString(ed.degree, 150),
      field: sanitizeString(ed.field, 150),
      graduationDate: sanitizeString(ed.graduationDate, 50)
    })),
    skills: Array.from(skillsSet).slice(0, STATIC_CONFIG.SAFETY_LIMITS.MAX_ARRAY_ITEMS).map(s => ({ name: s })),
    resumes: [],
    privacy: {
      isPublic: false,
      searchable: true,
      redactPii: false,
      excludedCompanies: [],
      excludedIndustries: [],
      privacyLevel: 1
    },
    deiAndAccommodations: {
      needsAccommodations,
      accommodationDetails: accommodationDetails ? sanitizeNarrative(accommodationDetails, 1000) : undefined,
      accommodationTypes: accommodationTypes.slice(0, 20).map(t => sanitizeString(t, 80)),
      shareDeiWithEmployers: true
    },
    parsedData: rawJson
  };
}
