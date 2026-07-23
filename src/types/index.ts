/**
 * Core Types for Ascend ATS
 */

export type AccountType = 'jobSeeker' | 'company' | 'staffingFirm';
export type ApplicationStatus = 'applied' | 'viewed' | 'interviewing' | 'offered' | 'rejected';
export type ApplicationMethod = 'auto' | 'one-click' | 'manual';
export type JobStatus = 'active' | 'inactive' | 'filled';

export interface UserSettings {
  autoApply: boolean;
  matchThreshold: number;
  notifications: boolean;
}

export interface AppUser {
  uid: string;
  email: string;
  accountType: AccountType;
  profileCompleted: boolean;
  settings: UserSettings;
  createdAt: Date;
  lastLogin: Date;
}

export interface WorkExperience {
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  description: string;
  skills: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  graduationDate: string;
}

export interface PrivacySettings {
  isPublic: boolean;
  shareToken?: string;
  slug?: string;
  searchable: boolean;
  redactPii: boolean;
  excludedCompanies: string[];
  excludedIndustries: string[];
  privacyLevel?: number; // 1: Unrestricted, 2: Contact Masked, 3: Anonymous, 4: Maximum Cloak
}

export interface ProfileSkill {
  name: string;
  domain?: string;
  subDomain?: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  years?: number;
}

export interface JobSeekerProfile {
  personalInfo: {
    firstName: string;
    lastName: string;
    preferredName?: string;
    pronouns?: string;
    phone?: string;
    location?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
  };
  professionalSummary: string;
  targetRole: string;
  targetIndustry?: string;
  targetLocations?: string[];
  preferredWorkplaceType?: 'Remote' | 'Hybrid' | 'On-Site' | 'Any';
  preferredLocations?: string[];
  targetSalary: number;
  workExperience: WorkExperience[];
  education: Education[];
  skills: ProfileSkill[];
  resumes: { url: string; name: string; uploadedAt: Date }[];
  targetBenefits?: string[];
  parsedData?: any;
  privacy: PrivacySettings;
  resumePreviewUrl?: string;
  sectionOrder?: string[];
  deiAndAccommodations?: {
    gender?: string;
    race?: string;
    veteranStatus?: string;
    disabilityStatus?: string;
    needsAccommodations: boolean;
    accommodationTypes: string[];
    accommodationDetails?: string;
    shareDeiWithEmployers: boolean;
  };
}

export interface Company {
  id: string;
  ownerUserId: string;
  name: string;
  logoUrl?: string;
  description: string;
  industry: string;
  size: string;
}

export interface JobRevision {
  id: string;
  versionNumber: string; // e.g. "v1.0", "v1.1", "v2.0"
  timestamp: any;
  modifiedByEmail: string;
  modifiedByUid: string;
  editReasonCategory: 'candidate_info_request' | 'salary_range_update' | 'scope_refinement' | 'typo_fix' | 'support_ticket' | 'other';
  editReasonNotes: string;
  previousValues: {
    title?: string;
    description?: string;
    requirements?: string;
    salaryMin?: number;
    salaryMax?: number;
  };
  newValues: {
    title?: string;
    description?: string;
    requirements?: string;
    salaryMin?: number;
    salaryMax?: number;
  };
  materialChangeDetected?: boolean;
  materialChangeDetails?: string[];
  flaggedRiskLevel?: 'low' | 'moderate' | 'high_bait_and_switch';
}

export interface JobTemplateBenchmark {
  id: string;
  title: string;
  industry: string;
  roleCategory: string;
  description: string;
  requirements: string;
  salaryMin: number;
  salaryMax: number;
  authenticityScore: number;
  avgConversionRate: string;
  appliedCount: number;
  transparencyRating: string;
  keyHighlights: string[];
}

export interface Job {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  description: string;
  requirements: string;
  workplaceType?: 'Remote' | 'Hybrid' | 'On-Site';
  location?: string;
  benefits?: string[];
  requiredSkills?: string[];
  preferredSkills?: string[];
  willingToConsiderNotes?: string;
  settlingOptions?: string[];
  parsedCriteria?: {
    skills: string[];
    requiredSkills?: string[];
    preferredSkills?: string[];
    minExperience: number;
    salaryRange?: { min: number; max: number };
    workplaceType?: 'Remote' | 'Hybrid' | 'On-Site';
    location?: string;
    benefits?: string[];
    willingToConsiderNotes?: string;
    settlingOptions?: string[];
  };
  status: JobStatus;
  createdAt: Date | any;
  updatedAt?: Date | any;
  currentVersion?: string;
  revisions?: JobRevision[];
  nefariousRiskScore?: number; // 0-100 score tracking post-application material shifts
  nefariousFlags?: string[];
  transparencyRating?: 'verified_transparent' | 'minor_edits' | 'under_review' | 'flagged';
  expiresAt?: Date | any;
  targetFillDate?: Date | string | any;
  budgetStatus?: 'approved' | 'pending' | 'passive_pipeline';
  requisitionType?: 'active_headcount' | 'growth_replacement' | 'market_research' | 'passive_pool';
  authenticityScore?: number;
  applicationCount?: number;
}

export interface Application {
  id: string;
  jobId: string;
  seekerId: string;
  companyId: string;
  status: ApplicationStatus;
  appliedAt: Date;
  method: ApplicationMethod;
  communications: Communication[];
  jobTitle?: string;
  companyName?: string;
}

export interface Communication {
  id: string;
  type: 'email' | 'system' | 'interview';
  content: string;
  timestamp: Date;
  senderId: string;
}
