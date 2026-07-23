import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Job, JobSeekerProfile, ProfileSkill } from '../types';

export const normalizeSkillName = (s: string): string => {
  return (s || '').toLowerCase().replace(/[\.\-_]/g, '').trim();
};

export const checkSkillMatch = (skillA: string, skillB: string): boolean => {
  if (!skillA || !skillB) return false;
  const a = skillA.toLowerCase().trim();
  const b = skillB.toLowerCase().trim();
  if (a === b) return true;

  const normA = normalizeSkillName(skillA);
  const normB = normalizeSkillName(skillB);
  if (normA === normB) return true;
  if (normA.length > 2 && normB.length > 2) {
    if (normA.includes(normB) || normB.includes(normA)) return true;
  }

  // Tokenize words
  const wordsA = a.split(/[\s,/\\()\-_.]+/).filter(w => w.length > 2);
  const wordsB = b.split(/[\s,/\\()\-_.]+/).filter(w => w.length > 2);

  return wordsA.some(wa => 
    wordsB.some(wb => wa === wb || (wa.length > 3 && wb.length > 3 && (wa.includes(wb) || wb.includes(wa))))
  );
};

export const getProfileSkills = (profile: JobSeekerProfile | null): ProfileSkill[] => {
  if (!profile) return [];
  
  const skillMap = new Map<string, ProfileSkill>();

  // 1. Direct skills
  if (Array.isArray(profile.skills)) {
    profile.skills.forEach(s => {
      const sItem = s as any;
      const name = typeof sItem === 'string' ? sItem.trim() : (sItem?.name || '').trim();
      if (name) {
        const key = normalizeSkillName(name);
        if (!skillMap.has(key)) {
          skillMap.set(key, typeof sItem === 'string' ? { name } : sItem);
        }
      }
    });
  }

  // 2. Skills from work experience
  if (Array.isArray(profile.workExperience)) {
    profile.workExperience.forEach(exp => {
      if (Array.isArray(exp.skills)) {
        exp.skills.forEach(s => {
          const name = typeof s === 'string' ? s.trim() : '';
          if (name) {
            const key = normalizeSkillName(name);
            if (!skillMap.has(key)) {
              skillMap.set(key, { name, domain: 'Work Experience' });
            }
          }
        });
      }
    });
  }

  // 3. Fallback: Check parsedData skills if present
  if (profile.parsedData?.skills && Array.isArray(profile.parsedData.skills)) {
    profile.parsedData.skills.forEach((s: any) => {
      const name = typeof s === 'string' ? s.trim() : (s.name || '').trim();
      if (name) {
        const key = normalizeSkillName(name);
        if (!skillMap.has(key)) {
          skillMap.set(key, typeof s === 'string' ? { name } : s);
        }
      }
    });
  }

  return Array.from(skillMap.values());
};

const COMMON_TECH_SKILLS = [
  'React', 'React.js', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Java', 'C++', 'Go',
  'AWS', 'Docker', 'Kubernetes', 'SQL', 'PostgreSQL', 'MongoDB', 'GraphQL', 'REST API',
  'Agile', 'Scrum', 'Project Management', 'Product Management', 'UI/UX', 'Figma',
  'Tailwind CSS', 'CSS', 'HTML', 'Git', 'CI/CD', 'DevOps', 'Communication', 'Leadership',
  'Data Analysis', 'Machine Learning', 'AI', 'Firebase', 'System Design', 'Redux', 'Next.js'
];

export const extractSkillsFromText = (text: string): string[] => {
  if (!text) return [];
  const lowerText = text.toLowerCase();
  const matched = new Set<string>();

  COMMON_TECH_SKILLS.forEach(skill => {
    if (lowerText.includes(skill.toLowerCase())) {
      matched.add(skill);
    }
  });

  return Array.from(matched);
};

export interface SkillComparisonResult {
  allCandidateSkills: {
    skill: ProfileSkill;
    isMatch: boolean;
    matchedRequirement?: string;
  }[];
  requiredJobSkills: {
    name: string;
    isMatched: boolean;
    matchedCandidateSkill?: string;
  }[];
  matchingCount: number;
  totalRequiredCount: number;
}

export const compareSkills = (profile: JobSeekerProfile | null, job: Job | null): SkillComparisonResult => {
  const candidateSkills = getProfileSkills(profile);
  
  // Extract or gather job required skills
  let requiredJobSkillsList: string[] = [];
  if (job?.parsedCriteria?.skills && Array.isArray(job.parsedCriteria.skills) && job.parsedCriteria.skills.length > 0) {
    requiredJobSkillsList = job.parsedCriteria.skills;
  } else if (job) {
    requiredJobSkillsList = extractSkillsFromText(`${job.title} ${job.description} ${job.requirements}`);
  }

  const fullJobText = job ? `${job.title} ${job.description} ${job.requirements}`.toLowerCase() : '';

  // Process required job skills
  const requiredJobSkills = requiredJobSkillsList.map(reqName => {
    const matchedCandidate = candidateSkills.find(cs => checkSkillMatch(cs.name, reqName));
    return {
      name: reqName,
      isMatched: !!matchedCandidate,
      matchedCandidateSkill: matchedCandidate?.name
    };
  });

  // Process candidate skills
  const allCandidateSkills = candidateSkills.map(candSkill => {
    // Check against required job skills list
    const matchedReq = requiredJobSkillsList.find(reqName => checkSkillMatch(candSkill.name, reqName));
    
    // Fallback: check if skill name is mentioned directly in job description / requirements
    const isTextMatch = !matchedReq && fullJobText.includes(candSkill.name.toLowerCase());

    return {
      skill: candSkill,
      isMatch: !!matchedReq || isTextMatch,
      matchedRequirement: matchedReq || (isTextMatch ? 'Mentioned in Job Details' : undefined)
    };
  });

  const matchingCount = requiredJobSkills.filter(s => s.isMatched).length;

  return {
    allCandidateSkills,
    requiredJobSkills,
    matchingCount,
    totalRequiredCount: requiredJobSkillsList.length
  };
};

export interface DetailedMatchBreakdown {
  overallScore: number; // 0-100
  reasons: string[];
  salaryMatch: {
    isMatch: boolean;
    jobMin?: number;
    jobMax?: number;
    targetSalary?: number;
    details: string;
  };
  workplaceMatch: {
    isMatch: boolean;
    jobWorkplaceType: string;
    preferredWorkplaceType: string;
    details: string;
  };
  benefitsMatch: {
    totalRequested: number;
    totalMatched: number;
    matchedList: string[];
    missingList: string[];
    details: string;
  };
  skillsMatch: {
    requiredMatched: string[];
    requiredMissing: string[];
    preferredMatched: string[];
    totalRequired: number;
    matchedCount: number;
    details: string;
  };
  willingToConsider: {
    hasOptions: boolean;
    notes: string;
    options: string[];
  };
}

export const getMatchBreakdown = (profile: JobSeekerProfile | null, job: Job | null): DetailedMatchBreakdown => {
  if (!profile || !job) {
    return {
      overallScore: 0,
      reasons: ['Profile or Job data unavailable'],
      salaryMatch: { isMatch: false, details: 'No salary details available' },
      workplaceMatch: { isMatch: false, jobWorkplaceType: 'Flexible', preferredWorkplaceType: 'Any', details: 'Location criteria unspecified' },
      benefitsMatch: { totalRequested: 0, totalMatched: 0, matchedList: [], missingList: [], details: 'No benefit preferences specified' },
      skillsMatch: { requiredMatched: [], requiredMissing: [], preferredMatched: [], totalRequired: 0, matchedCount: 0, details: 'No skills criteria found' },
      willingToConsider: { hasOptions: false, notes: '', options: [] }
    };
  }

  const scoreNum = Math.round(calculateMatchScore(profile, job) * 100);
  const reasons: string[] = [];

  // 1. Salary Analysis
  const jobMin = job.parsedCriteria?.salaryRange?.min || 80000;
  const jobMax = job.parsedCriteria?.salaryRange?.max || 130000;
  const candSalary = profile.targetSalary || 100000;
  let salaryMatch = { isMatch: false, jobMin, jobMax, targetSalary: candSalary, details: '' };

  if (candSalary >= jobMin && candSalary <= jobMax) {
    salaryMatch.isMatch = true;
    salaryMatch.details = `Offered range ($${(jobMin/1000).toFixed(0)}k - $${(jobMax/1000).toFixed(0)}k) satisfies your target of $${(candSalary/1000).toFixed(0)}k/yr`;
    reasons.push(`💰 Compensation Fit: ${salaryMatch.details}`);
  } else if (candSalary < jobMin) {
    salaryMatch.isMatch = true;
    salaryMatch.details = `Offered range starting at $${(jobMin/1000).toFixed(0)}k exceeds your target expectation of $${(candSalary/1000).toFixed(0)}k/yr`;
    reasons.push(`💰 Compensation Upgrade: ${salaryMatch.details}`);
  } else {
    salaryMatch.isMatch = false;
    salaryMatch.details = `Target salary ($${(candSalary/1000).toFixed(0)}k) is above maximum base budget ($${(jobMax/1000).toFixed(0)}k)`;
  }

  // 2. Workplace & Location Analysis
  const jobWorkplace = job.workplaceType || job.parsedCriteria?.workplaceType || (job.title.toLowerCase().includes('remote') ? 'Remote' : 'Hybrid');
  const prefWorkplace = profile.preferredWorkplaceType || 'Remote';
  let workplaceMatch = {
    isMatch: false,
    jobWorkplaceType: jobWorkplace,
    preferredWorkplaceType: prefWorkplace,
    details: ''
  };

  if (prefWorkplace === 'Any' || jobWorkplace.toLowerCase() === prefWorkplace.toLowerCase()) {
    workplaceMatch.isMatch = true;
    workplaceMatch.details = `${jobWorkplace} setting matches your preferred ${prefWorkplace === 'Any' ? 'flexible' : prefWorkplace} workplace arrangement`;
    reasons.push(`🌐 Workplace Setting: ${workplaceMatch.details}`);
  } else {
    workplaceMatch.details = `${jobWorkplace} requisition vs your ${prefWorkplace} preference`;
  }

  // 3. Benefits & Perks Alignment
  const defaultJobBenefits = job.benefits || job.parsedCriteria?.benefits || [
    'Health & Dental Insurance', '401(k) Matching', 'Unlimited PTO', 'Equity / Stock Options'
  ];
  const candBenefits = profile.targetBenefits || (profile as any).preferredBenefits || [
    'Health Insurance', '401k Match', 'Unlimited PTO'
  ];

  const matchedBenefits: string[] = [];
  const missingBenefits: string[] = [];

  candBenefits.forEach(reqB => {
    const isFound = defaultJobBenefits.some(jb => jb.toLowerCase().includes(reqB.toLowerCase()) || reqB.toLowerCase().includes(jb.toLowerCase()));
    if (isFound) matchedBenefits.push(reqB);
    else missingBenefits.push(reqB);
  });

  const benefitsMatch = {
    totalRequested: candBenefits.length,
    totalMatched: matchedBenefits.length,
    matchedList: matchedBenefits,
    missingList: missingBenefits,
    details: candBenefits.length > 0
      ? `Provides ${matchedBenefits.length} of ${candBenefits.length} requested benefits (${matchedBenefits.join(', ') || 'Standard package'})`
      : 'Comprehensive employer benefits package offered'
  };

  if (matchedBenefits.length > 0) {
    reasons.push(`🎁 Benefits Alignment: ${benefitsMatch.details}`);
  }

  // 4. Skills Analysis (Required vs Preferred)
  const skillComp = compareSkills(profile, job);
  const reqList = job.requiredSkills || job.parsedCriteria?.requiredSkills || job.parsedCriteria?.skills || [];
  const prefList = job.preferredSkills || job.parsedCriteria?.preferredSkills || [];

  const requiredMatched: string[] = [];
  const requiredMissing: string[] = [];
  const preferredMatched: string[] = [];

  if (reqList.length > 0) {
    reqList.forEach(reqS => {
      const isM = skillComp.requiredJobSkills.some(s => s.name.toLowerCase() === reqS.toLowerCase() && s.isMatched);
      if (isM) requiredMatched.push(reqS);
      else requiredMissing.push(reqS);
    });
  } else {
    // fallback from compareSkills
    skillComp.requiredJobSkills.forEach(rs => {
      if (rs.isMatched) requiredMatched.push(rs.name);
      else requiredMissing.push(rs.name);
    });
  }

  if (prefList.length > 0) {
    prefList.forEach(ps => {
      const isM = skillComp.allCandidateSkills.some(cs => checkSkillMatch(cs.skill.name, ps));
      if (isM) preferredMatched.push(ps);
    });
  }

  const skillsMatch = {
    requiredMatched,
    requiredMissing,
    preferredMatched,
    totalRequired: Math.max(reqList.length, skillComp.totalRequiredCount),
    matchedCount: requiredMatched.length,
    details: `Matched ${requiredMatched.length} of ${Math.max(reqList.length, skillComp.totalRequiredCount)} core required skills`
  };

  if (requiredMatched.length > 0) {
    reasons.push(`⚡ Skill Overlap: Matched ${requiredMatched.length} core required skills (${requiredMatched.join(', ')})`);
  }
  if (preferredMatched.length > 0) {
    reasons.push(`⭐ Bonus Qualification: Matched ${preferredMatched.length} preferred skills (${preferredMatched.join(', ')})`);
  }

  // 5. Employer Settling & Willing to Consider Flexibility
  const notes = job.willingToConsiderNotes || job.parsedCriteria?.willingToConsiderNotes || '';
  const options = job.settlingOptions || job.parsedCriteria?.settlingOptions || [];
  const willingToConsider = {
    hasOptions: Boolean(notes || options.length > 0),
    notes,
    options
  };

  if (willingToConsider.hasOptions) {
    reasons.push(`💡 Employer Flexibility: ${notes || options.join('; ')}`);
  }

  return {
    overallScore: scoreNum,
    reasons: reasons.length > 0 ? reasons : ['General qualifications and role category match'],
    salaryMatch,
    workplaceMatch,
    benefitsMatch,
    skillsMatch,
    willingToConsider
  };
};

export const calculateMatchScore = (profile: JobSeekerProfile, job: Job): number => {
  let score = 0;

  // 1. Skills Match (40%)
  const skillComp = compareSkills(profile, job);
  if (skillComp.totalRequiredCount > 0) {
    const ratio = skillComp.matchingCount / skillComp.totalRequiredCount;
    score += Math.min(ratio, 1.0) * 0.40;
  } else if (skillComp.allCandidateSkills.length > 0) {
    const matchedCandidateCount = skillComp.allCandidateSkills.filter(s => s.isMatch).length;
    const ratio = matchedCandidateCount / Math.max(skillComp.allCandidateSkills.length, 1);
    score += Math.min(ratio, 1.0) * 0.40;
  } else {
    score += 0.25; // neutral baseline if no skills provided anywhere
  }

  // 2. Experience Match (25%)
  const totalExp = profile.workExperience ? profile.workExperience.length : 0;
  const minExp = job.parsedCriteria?.minExperience || 1;
  const expScore = Math.min(totalExp / Math.max(minExp, 1), 1.0);
  score += expScore * 0.25;

  // 3. Salary Overlap (20%)
  if (job.parsedCriteria?.salaryRange && profile.targetSalary) {
    const { min, max } = job.parsedCriteria.salaryRange;
    if (profile.targetSalary >= min && profile.targetSalary <= max) {
      score += 0.20;
    } else if (profile.targetSalary < min) {
      score += 0.18; // Candidate target is below min salary (very attractive for employers)
    } else {
      const ratio = min / profile.targetSalary;
      score += Math.max(0.05, 0.20 * ratio);
    }
  } else {
    score += 0.20;
  }

  // 4. Role Title Match (15%)
  if (profile.targetRole && job.title) {
    if (checkSkillMatch(profile.targetRole, job.title)) {
      score += 0.15;
    } else {
      const targetWords = profile.targetRole.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      const jobWords = job.title.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      if (targetWords.some(tw => jobWords.includes(tw))) {
        score += 0.10;
      } else {
        score += 0.05;
      }
    }
  } else {
    score += 0.10;
  }

  return Math.min(Math.round(score * 100) / 100, 1.0);
};

export const useJobMatching = (profile: JobSeekerProfile | null) => {
  const [matches, setMatches] = useState<{ job: Job; score: number; tier: 'auto' | 'one-click' | 'suggested' }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      setLoading(false);
      return;
    }

    // Real-time listener for active jobs
    const jobsQuery = query(collection(db, 'jobs'), where('status', '==', 'active'));
    
    const unsubscribe = onSnapshot(jobsQuery, (snapshot) => {
      const allJobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
      
      const scoredMatches = allJobs.map(job => {
        const score = calculateMatchScore(profile, job);
        
        let tier: 'auto' | 'one-click' | 'suggested' = 'suggested';
        if (score >= 0.85) tier = 'auto';
        else if (score >= 0.70) tier = 'one-click';
        
        return { job, score, tier };
      }).sort((a, b) => b.score - a.score);

      setMatches(scoredMatches);
      setLoading(false);
    });

    return unsubscribe;
  }, [profile]);

  return { matches, loading };
};

