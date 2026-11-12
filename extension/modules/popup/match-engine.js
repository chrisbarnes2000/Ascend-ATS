/**
 * @fileoverview Pure Deterministic Match Engine for Ascend ATS Browser Extension.
 * Cross-references scraped job postings against candidate profile qualifications.
 * NASA JPL Rule 1 & Rule 4: Deterministic algorithms, bounded loops, and <60 lines per method.
 */

const COMMON_TECH_SKILLS = [
  'React', 'React.js', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Java', 'C++', 'Go',
  'AWS', 'Docker', 'Kubernetes', 'SQL', 'PostgreSQL', 'MongoDB', 'GraphQL', 'REST API',
  'Agile', 'Scrum', 'Project Management', 'Product Management', 'UI/UX', 'Figma',
  'Tailwind CSS', 'CSS', 'HTML', 'Git', 'CI/CD', 'DevOps', 'Communication', 'Leadership',
  'Data Analysis', 'Machine Learning', 'AI', 'Firebase', 'System Design', 'Redux', 'Next.js'
];

/**
 * Normalizes a skill string for fuzzy equality comparison.
 * @param {string} s - Raw skill name.
 * @returns {string} Sanitized lower-case string without punctuation.
 */
export function normalizeSkillName(s) {
  if (!s || typeof s !== 'string') return '';
  return s.toLowerCase().replace(/[\.\-_]/g, '').trim();
}

/**
 * Evaluates semantic match between two skill strings.
 * @param {string} skillA - Candidate or job skill.
 * @param {string} skillB - Comparison skill.
 * @returns {boolean} True if matching.
 */
export function checkSkillMatch(skillA, skillB) {
  if (!skillA || !skillB || typeof skillA !== 'string' || typeof skillB !== 'string') {
    return false;
  }
  const a = skillA.toLowerCase().trim();
  const b = skillB.toLowerCase().trim();
  if (a === b) return true;

  const normA = normalizeSkillName(skillA);
  const normB = normalizeSkillName(skillB);
  if (normA === normB && normA.length > 0) return true;

  if (normA.length > 2 && normB.length > 2) {
    if (normA.includes(normB) || normB.includes(normA)) return true;
  }

  const wordsA = a.split(/[\s,/\\()\-_.]+/).filter(w => w.length > 2);
  const wordsB = b.split(/[\s,/\\()\-_.]+/).filter(w => w.length > 2);

  return wordsA.some(wa =>
    wordsB.some(wb => wa === wb || (wa.length > 3 && wb.length > 3 && (wa.includes(wb) || wb.includes(wa))))
  );
}

/**
 * Extracts skills from raw job text using keyword matching.
 * @param {string} text - Job description text.
 * @returns {string[]} Array of identified unique skills.
 */
export function extractSkillsFromText(text) {
  if (!text || typeof text !== 'string') return [];
  const lowerText = text.toLowerCase();
  const matched = new Set();

  for (let i = 0; i < COMMON_TECH_SKILLS.length && i < 100; i++) {
    const skill = COMMON_TECH_SKILLS[i];
    if (lowerText.includes(skill.toLowerCase())) {
      matched.add(skill);
    }
  }

  return Array.from(matched);
}

/**
 * Consolidates skills from candidate profile skills and work experience.
 * @param {Object|null} profile - Candidate profile payload.
 * @returns {{ name: string, domain?: string }[]}
 */
export function getProfileSkills(profile) {
  if (!profile || typeof profile !== 'object') return [];
  const skillMap = new Map();

  if (Array.isArray(profile.skills)) {
    profile.skills.forEach(s => {
      const name = typeof s === 'string' ? s.trim() : (s && s.name ? s.name.trim() : '');
      if (name) {
        const key = normalizeSkillName(name);
        if (!skillMap.has(key)) skillMap.set(key, { name });
      }
    });
  }

  if (Array.isArray(profile.workExperience)) {
    profile.workExperience.forEach(exp => {
      if (exp && Array.isArray(exp.skills)) {
        exp.skills.forEach(s => {
          const name = typeof s === 'string' ? s.trim() : '';
          if (name) {
            const key = normalizeSkillName(name);
            if (!skillMap.has(key)) skillMap.set(key, { name, domain: 'Work Experience' });
          }
        });
      }
    });
  }

  return Array.from(skillMap.values());
}

/**
 * Parses salary and workplace criteria from job text.
 * @param {string} title - Job Title.
 * @param {string} text - Combined job description text.
 * @returns {{ minSalary: number, maxSalary: number, workplaceType: string, minExperience: number }}
 */
export function parseJobCriteriaFromText(title, text) {
  const combined = `${title || ''} ${text || ''}`;
  let workplaceType = 'Hybrid';
  const lower = combined.toLowerCase();

  if (lower.includes('remote') || lower.includes('work from anywhere')) {
    workplaceType = 'Remote';
  } else if (lower.includes('on-site') || lower.includes('onsite') || lower.includes('in-office')) {
    workplaceType = 'On-Site';
  }

  let minSalary = 0;
  let maxSalary = 0;
  const kMatch = combined.match(/\$(\d{2,3})[kK]\s*(?:-|to)\s*\$(\d{2,3})[kK]/);
  if (kMatch) {
    minSalary = parseInt(kMatch[1], 10) * 1000;
    maxSalary = parseInt(kMatch[2], 10) * 1000;
  } else {
    const fullMatch = combined.match(/\$(\d{2,3}),(\d{3})\s*(?:-|to)\s*\$(\d{2,3}),(\d{3})/);
    if (fullMatch) {
      minSalary = parseInt(`${fullMatch[1]}${fullMatch[2]}`, 10);
      maxSalary = parseInt(`${fullMatch[3]}${fullMatch[4]}`, 10);
    }
  }

  let minExperience = 2;
  const expMatch = combined.match(/(\d+)\+?\s*(?:years|yrs)\s+(?:of\s+)?experience/i);
  if (expMatch) {
    minExperience = Math.min(15, Math.max(1, parseInt(expMatch[1], 10)));
  }

  return { minSalary, maxSalary, workplaceType, minExperience };
}

/**
 * Performs detailed skill comparison between candidate and job posting.
 * @param {Object|null} profile - Candidate profile.
 * @param {Object|null} job - Structured job payload.
 * @returns {Object} Full skill comparison breakdown.
 */
export function compareSkills(profile, job) {
  const candidateSkills = getProfileSkills(profile);
  let requiredJobSkillsList = [];

  if (job && Array.isArray(job.requiredSkills) && job.requiredSkills.length > 0) {
    requiredJobSkillsList = job.requiredSkills;
  } else if (job && job.description) {
    requiredJobSkillsList = extractSkillsFromText(`${job.title || ''} ${job.description}`);
  }

  const fullJobText = (job ? `${job.title || ''} ${job.description || ''}` : '').toLowerCase();

  const requiredJobSkills = requiredJobSkillsList.map(reqName => {
    const matchedCandidate = candidateSkills.find(cs => checkSkillMatch(cs.name, reqName));
    return {
      name: reqName,
      isMatched: Boolean(matchedCandidate),
      matchedCandidateSkill: matchedCandidate ? matchedCandidate.name : undefined
    };
  });

  const allCandidateSkills = candidateSkills.map(candSkill => {
    const matchedReq = requiredJobSkillsList.find(reqName => checkSkillMatch(candSkill.name, reqName));
    const isTextMatch = !matchedReq && fullJobText.includes(candSkill.name.toLowerCase());
    return {
      skill: candSkill,
      isMatch: Boolean(matchedReq || isTextMatch),
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
}

/**
 * Calculates quantitative match score between 0.0 and 1.0 (NASA JPL Rule 4 compliant).
 * @param {Object|null} profile - Candidate profile.
 * @param {Object|null} job - Job object.
 * @returns {number} Score between 0.0 and 1.0.
 */
export function calculateMatchScore(profile, job) {
  if (!profile || !job) return 0;
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
    score += 0.15;
  }

  // 2. Experience Match (25%)
  const totalExp = Array.isArray(profile.workExperience) ? profile.workExperience.length : 1;
  const minExp = job.minExperience || 2;
  score += Math.min(totalExp / Math.max(minExp, 1), 1.0) * 0.25;

  // 3. Salary Overlap (20%)
  const targetSalary = profile.targetSalary || 0;
  if (job.minSalary && targetSalary > 0) {
    if (targetSalary >= job.minSalary && (!job.maxSalary || targetSalary <= job.maxSalary)) {
      score += 0.20;
    } else if (targetSalary < job.minSalary) {
      score += 0.18;
    } else {
      const ratio = job.minSalary / targetSalary;
      score += Math.max(0.05, 0.20 * ratio);
    }
  } else {
    score += 0.15;
  }

  // 4. Role Title Match (15%)
  if (profile.targetRole && job.title) {
    if (checkSkillMatch(profile.targetRole, job.title)) {
      score += 0.15;
    } else {
      const targetWords = profile.targetRole.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      const jobWords = job.title.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      const hasWordOverlap = targetWords.some(tw => jobWords.includes(tw));
      score += hasWordOverlap ? 0.10 : 0.04;
    }
  } else {
    score += 0.08;
  }

  return Math.min(1.0, Math.max(0.05, Math.round(score * 100) / 100));
}

/**
 * Builds an elaborate diff comparison and breakdown between candidate and job.
 * @param {Object|null} profile - Candidate profile.
 * @param {Object|null} job - Job object.
 * @returns {Object} Structured diff breakdown.
 */
export function getMatchBreakdown(profile, job) {
  if (!profile || !job) {
    return {
      overallScore: 0,
      isLowMatch: true,
      reasons: ['Profile or job details missing'],
      skillsMatch: { matched: [], missing: [] },
      salaryMatch: { isMatch: false, details: 'Salary unavailable' },
      workplaceMatch: { isMatch: false, details: 'Workplace unavailable' }
    };
  }

  const scoreNum = Math.round(calculateMatchScore(profile, job) * 100);
  const isLowMatch = scoreNum < 60;
  const reasons = [];

  // Skills Diff
  const skillComp = compareSkills(profile, job);
  const matchedSkills = skillComp.requiredJobSkills.filter(s => s.isMatched).map(s => s.name);
  const missingSkills = skillComp.requiredJobSkills.filter(s => !s.isMatched).map(s => s.name);

  if (matchedSkills.length > 0) {
    reasons.push(`Matched ${matchedSkills.length} core requirements: ${matchedSkills.slice(0, 4).join(', ')}`);
  }
  if (missingSkills.length > 0) {
    reasons.push(`Missing ${missingSkills.length} expected qualifications: ${missingSkills.slice(0, 4).join(', ')}`);
  }

  // Salary Diff
  const candSalary = profile.targetSalary || 0;
  let salaryMatch = { isMatch: true, details: 'No salary constraints specified' };
  if (job.minSalary && candSalary > 0) {
    const minK = Math.round(job.minSalary / 1000);
    const maxK = job.maxSalary ? Math.round(job.maxSalary / 1000) : null;
    const candK = Math.round(candSalary / 1000);

    if (candSalary >= job.minSalary && (!job.maxSalary || candSalary <= job.maxSalary)) {
      salaryMatch = { isMatch: true, details: `Budget ($${minK}k${maxK ? ` - $${maxK}k` : ''}) meets your target ($${candK}k)` };
      reasons.push(`Compensation Fit: ${salaryMatch.details}`);
    } else if (candSalary < job.minSalary) {
      salaryMatch = { isMatch: true, details: `Offered base starting at $${minK}k exceeds your target expectation ($${candK}k)` };
      reasons.push(`Compensation Upgrade: ${salaryMatch.details}`);
    } else {
      salaryMatch = { isMatch: false, details: `Target ($${candK}k) exceeds budget cap ($${maxK || minK}k)` };
      reasons.push(`Compensation Gap: ${salaryMatch.details}`);
    }
  }

  // Workplace Diff
  const candWorkplace = profile.preferredWorkplaceType || 'Remote';
  const jobWorkplace = job.workplaceType || 'Hybrid';
  const isWorkplaceMatch = candWorkplace === 'Any' || candWorkplace.toLowerCase() === jobWorkplace.toLowerCase();
  const workplaceMatch = {
    isMatch: isWorkplaceMatch,
    details: isWorkplaceMatch
      ? `${jobWorkplace} matches your preference`
      : `${jobWorkplace} requisition vs your ${candWorkplace} target`
  };
  reasons.push(workplaceMatch.details);

  return {
    overallScore: scoreNum,
    isLowMatch,
    reasons,
    skillsMatch: {
      matched: matchedSkills,
      missing: missingSkills,
      ratio: `${matchedSkills.length}/${skillComp.totalRequiredCount || matchedSkills.length}`
    },
    salaryMatch,
    workplaceMatch,
    jobTitle: job.title || 'Unknown Position',
    company: job.company || 'Unknown Employer'
  };
}
