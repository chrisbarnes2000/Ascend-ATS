/**
 * Core Types for Ascend ATS
 */

export type AccountType = 'jobSeeker' | 'recruiter' | 'company' | 'admin' | 'companyOwner' | 'staffingFirm';
export type ApplicationStatus = 'applied' | 'viewed' | 'interviewing' | 'offered' | 'rejected';
export type ApplicationMethod = 'auto' | 'one-click' | 'manual';
export type JobStatus = 'active' | 'inactive' | 'filled' | 'draft' | 'archived' | 'planned';

export interface UserSettings {
  autoApply: boolean;
  matchThreshold: number;
  notifications: boolean;
}

export interface IngestedJobData {
  title: string;
  companyName: string;
  description: string;
  requirements: string;
  location: string;
  workplaceType: 'Remote' | 'Hybrid' | 'On-Site';
  salaryMin: number;
  salaryMax: number;
  requiredSkills: string[];
  preferredSkills: string[];
  benefits: string[];
  extractedId: string;
  isAiEnhanced: boolean;
  companyOverview: string | null;
  eeoStatement: string | null;
  clearanceOrExportControl: string | null;
  minimumQualifications: string | null;
  preferredQualifications: string | null;
  insights: {
    interviewQuestions: Array<{ question: string; answer: string }>;
    unstatedExpectations: string[];
    matchStrategy: string;
  };
  jobNumber?: string;
  department?: string;
  salaryType?: string;
  expiresAt?: string;
  sourceBoard?: string;
  recruiterInfo?: any;
}

export interface AppUser {
  uid: string;
  email: string;
  emailOriginal?: string;
  linkedProviders?: string[];
  accountType: AccountType;
  staffingFirmId?: string;
  staffingFirmName?: string;
  staffingRole?: 'admin' | 'recruiter' | 'owner';
  companyId?: string;
  companyName?: string;
  claimedCompanyId?: string;
  activeCompanyId?: string;
  activeCompanyName?: string;
  companyRole?: 'owner' | 'manager' | 'recruiter' | 'admin';
  profileCompleted: boolean;
  roleSwitchHistory?: { role: AccountType; timestamp: any }[];
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
  credlyUrl?: string;
}

export interface CulturalValuesBlueprint {
  topValues: string[]; // Selected from Fast Company 26 Values IDs
  cultureAddNarrative?: string;
  kindnessVsNicenessStance?: string;
  ecosystemStance?: string;
  uncomfortableTransparencyPolicy?: string;
  pacingRestPolicy?: string;
  recruiterSlaDays?: number;
}

export interface InterviewDebrief {
  id: string;
  interviewDate: string;
  roundName: string;
  candidateRating?: number;
  cultureAddImpressions?: string;
  perceivedTransparency?: string;
  competingOffersStatus?: string;
  managerNotes?: string;
  submittedAt: any;
}

export interface TargetLocation {
  placeId: string;
  description: string;
  commuteConstraintMinutes?: number;
  distanceConstraintMiles?: number;
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
  targetIndustries?: string[];
  targetLocations?: TargetLocation[];
  preferredWorkplaceType?: 'Remote' | 'Hybrid' | 'On-Site' | 'Any';
  preferredLocations?: string[];
  targetSalary: number;
  workExperience: WorkExperience[];
  education: Education[];
  skills: ProfileSkill[];
  resumes: { url: string; name: string; uploadedAt: Date }[];
  targetBenefits?: string[];
  culturalPreferences?: string[]; // Selected Fast Company cultural value IDs
  recruiterPreferences?: {
    preferredSpecialties?: string[];
    communicationFrequency?: 'Daily' | 'Weekly' | 'As Needed' | 'Milestone Only';
    expectedSalaryMin?: number;
    requiresVideoCall?: boolean;
  };
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

export interface StaffingFirm {
  id: string;
  name: string;
  ownerId: string;
  adminEmails: string[];
  website?: string;
  logoUrl?: string;
  description?: string;
  isVerified: boolean;
  createdAt: any;
  updatedAt: any;
  memberCount: number;
  specialties: string[];
}

export interface StaffingInvitation {
  id: string;
  email: string;
  targetFirmName: string;
  role: 'admin' | 'recruiter' | 'owner';
  status: 'pending' | 'accepted' | 'expired';
  invitedByUid: string;
  invitedByEmail: string;
  createdAt: any;
  expiresAt: any;
  inviteCode: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export interface PartnerRequest {
  id: string;
  email: string;
  source: string;
  details: string;
  status: 'pending' | 'reviewed' | 'rejected';
  createdAt: any;
}

export interface RecruiterProfile {
  personalInfo: {
    firstName: string;
    lastName: string;
    title?: string;
    phone?: string;
    linkedinUrl?: string;
    avatarUrl?: string;
    email?: string;
    location?: string;
  };
  bio: string;
  specialties: string[];
  companyId?: string;
  companyName?: string;
  companyLogoUrl?: string;
  website?: string;
  isPublic: boolean;
  yearsExperience?: number;
  contactPreference?: 'email' | 'linkedin' | 'phone';
  culturalValuesBlueprint?: CulturalValuesBlueprint;
  updatedAt?: any;
}

export interface CompanyRecruiterInvite {
  id: string;
  companyId: string;
  companyName: string;
  invitedByUid: string;
  invitedByEmail: string;
  inviteCode: string;
  status: 'pending' | 'accepted' | 'revoked';
  acceptedByUid?: string;
  acceptedByEmail?: string;
  createdAt: any;
  expiresAt?: any;
}

export interface CompanyClaimRequest {
  id: string;
  userId: string;
  userEmail: string;
  companyId: string;
  companyName: string;
  companyOwnerId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  updatedAt: any;
}

export interface Company {
  id: string;
  ownerUserId: string;
  name: string;
  logoUrl?: string;
  description: string;
  industry: string;
  size: string;
  website?: string;
  location?: string;
  linkedin?: string;
  twitter?: string;
  github?: string;
  glassdoor?: string;
  recruiterUids?: string[];
  pendingInviteCodes?: string[];
  adminEmails?: string[];
  culturalValuesBlueprint?: CulturalValuesBlueprint;
  updatedAt?: any;
}

export interface MaterialShift {
  field: 'salaryMax' | 'salaryMin' | 'requirements' | 'title' | 'workplaceType' | 'location' | 'companyName' | 'posterFirmName';
  description: string;
  severity: 'low' | 'moderate' | 'high_bait_and_switch';
  riskPoints: number;
  previousValue?: any;
  newValue?: any;
}

export interface JobRevision {
  id: string;
  versionNumber: string; // e.g. "v1.0.0", "v1.1.0", "v2.0.0"
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
    workplaceType?: string;
    location?: string;
    companyName?: string;
    posterFirmName?: string;
  };
  newValues: {
    title?: string;
    description?: string;
    requirements?: string;
    salaryMin?: number;
    salaryMax?: number;
    workplaceType?: string;
    location?: string;
    companyName?: string;
    posterFirmName?: string;
  };
  materialChangeDetected?: boolean;
  materialChangeDetails?: string[];
  materialShifts?: MaterialShift[];
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
  jobNumber?: string;
  department?: string;
  authenticityScore: number;
  avgConversionRate: string;
  appliedCount: number;
  transparencyRating: string;
  keyHighlights: string[];
}

export interface RecruiterOutreachInfo {
  name?: string;
  email?: string;
  phone?: string;
  firmName?: string;
  firmWebsite?: string;
  linkedInUrl?: string;
  clientName?: string;
  workAuth?: string;
  contractType?: string;
  rate?: string;
  location?: string;
}

export interface Job {
  id: string;
  companyId: string;
  companyName: string;
  posterFirmId?: string;
  posterFirmName?: string;
  recruiterInfo?: RecruiterOutreachInfo;
  sourceBoard?: string;
  isClientConfidential?: boolean;
  title: string;
  description: string;
  requirements: string;
  jobNumber?: string;
  department?: string;
  workplaceType?: 'Remote' | 'Hybrid' | 'On-Site';
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
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
  culturalValuesPillars?: string[]; // Selected Fast Company cultural value IDs
  cultureAddHighlights?: string[];
  status: JobStatus;
  createdAt: Date | any;
  updatedAt?: Date | any;
  currentVersion?: string;
  revisions?: JobRevision[];
  materialShifts?: MaterialShift[];
  nefariousRiskScore?: number; // 0-100 score tracking post-application material shifts
  nefariousFlags?: string[];
  transparencyRating?: 'verified_transparent' | 'minor_edits' | 'under_review' | 'flagged';
  expiresAt?: Date | any;
  targetFillDate?: Date | string | any;
  budgetStatus?: 'approved' | 'pending' | 'passive_pipeline';
  requisitionType?: 'active_headcount' | 'growth_replacement' | 'market_research' | 'passive_pool';
  authenticityScore?: number;
  applicationCount?: number;
  flaggedForReview?: boolean;
  reportCount?: number;
}

export type JobReportReason = 
  | 'incorrect_company'
  | 'incorrect_poster'
  | 'misleading_text'
  | 'expired_or_closed'
  | 'scam_or_suspicious'
  | 'other';

export interface JobReport {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  posterFirmName?: string;
  reporterUid?: string;
  reporterEmail?: string;
  reporterRole: 'candidate' | 'recruiter' | 'admin' | 'anonymous';
  reason: JobReportReason;
  notes?: string;
  proposedCompanyName?: string;
  proposedPosterFirmName?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: any;
  resolvedAt?: any;
  resolvedBy?: string;
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
  stateHistory?: {
    state: ApplicationStatus;
    timestamp: any;
    reason?: string;
  }[];
  jobTitle?: string;
  companyName?: string;
  interviewDebriefs?: InterviewDebrief[];
}

export interface Communication {
  id: string;
  type: 'email' | 'system' | 'interview';
  content: string;
  timestamp: Date;
  senderId: string;
}

export interface RecruiterLead {
  id: string;
  recruiterName: string;
  recruiterEmail?: string | null;
  recruiterPhone?: string | null;
  firmName?: string;
  clientName?: string | null;
  sourceBoard?: string;
  jobTitle?: string;
  status: 'discovered' | 'invited' | 'contacted' | 'claimed';
  discoveredByUid?: string;
  discoveredByEmail?: string;
  linkedInUrl?: string | null;
  relationship?: string | null;
  createdAt: any;
}
