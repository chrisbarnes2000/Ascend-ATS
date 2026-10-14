import { Job, MaterialShift } from '../types';
import { STATIC_CONFIG } from '../config';

/**
 * Requisition Material Shift & Audit Engine
 * Complies with NASA JPL Rule 4 (compact functions) and Rule 8 (no magic values).
 */

export interface MaterialShiftEvaluation {
  shifts: MaterialShift[];
  riskScoreIncrease: number;
  totalRiskScore: number;
  flaggedRiskLevel: 'low' | 'moderate' | 'high_bait_and_switch';
  transparencyRating: 'verified_transparent' | 'minor_edits' | 'under_review' | 'flagged';
  nextVersionNumber: string;
}

const SENIORITY_LEVELS: Record<string, number> = {
  intern: 1,
  trainee: 1,
  associate: 2,
  junior: 2,
  'entry-level': 2,
  mid: 3,
  senior: 4,
  lead: 5,
  staff: 6,
  principal: 7,
  director: 8,
  vp: 9,
  head: 8
};

function extractSeniority(title = ''): number | null {
  const words = title.toLowerCase().split(/[\s\-_/]+/);
  for (const word of words) {
    if (SENIORITY_LEVELS[word] !== undefined) {
      return SENIORITY_LEVELS[word];
    }
  }
  return null;
}

/**
 * Evaluates differences between an existing job and an edited revision.
 */
export function detectMaterialShifts(
  oldJob: Partial<Job> | null,
  newJob: Partial<Job>
): MaterialShiftEvaluation {
  const shifts: MaterialShift[] = [];
  let riskScoreIncrease = 0;
  const cfg = STATIC_CONFIG.MATERIAL_SHIFT_THRESHOLDS;

  if (oldJob) {
    const oldMax = oldJob.parsedCriteria?.salaryRange?.max || oldJob.salaryMax || 0;
    const newMax = newJob.parsedCriteria?.salaryRange?.max || newJob.salaryMax || 0;
    const oldMin = oldJob.parsedCriteria?.salaryRange?.min || oldJob.salaryMin || 0;
    const newMin = newJob.parsedCriteria?.salaryRange?.min || newJob.salaryMin || 0;

    // 1. Max Salary Drop Detection
    if (oldMax > 0 && newMax < oldMax * (1 - cfg.MAX_SALARY_DROP_PCT / 100)) {
      const dropPct = Math.round(((oldMax - newMax) / oldMax) * 100);
      shifts.push({
        field: 'salaryMax',
        description: `Max salary decreased by ${dropPct}% ($${oldMax.toLocaleString()} ➔ $${newMax.toLocaleString()})`,
        severity: 'high_bait_and_switch',
        riskPoints: cfg.WEIGHTS.HIGH_BAIT_AND_SWITCH,
        previousValue: oldMax,
        newValue: newMax
      });
      riskScoreIncrease += cfg.WEIGHTS.HIGH_BAIT_AND_SWITCH;
    }

    // 2. Min Salary Drop Detection
    if (oldMin > 0 && newMin < oldMin * (1 - cfg.MIN_SALARY_DROP_PCT / 100)) {
      const dropPct = Math.round(((oldMin - newMin) / oldMin) * 100);
      shifts.push({
        field: 'salaryMin',
        description: `Min salary decreased by ${dropPct}% ($${oldMin.toLocaleString()} ➔ $${newMin.toLocaleString()})`,
        severity: 'moderate',
        riskPoints: cfg.WEIGHTS.MIN_SALARY_DROP,
        previousValue: oldMin,
        newValue: newMin
      });
      riskScoreIncrease += cfg.WEIGHTS.MIN_SALARY_DROP;
    }

    // 3. Scope Expansion (Requirements Length)
    const oldReqLen = (oldJob.requirements || '').length;
    const newReqLen = (newJob.requirements || '').length;
    if (oldReqLen >= cfg.MIN_SCOPE_LENGTH && newReqLen > oldReqLen * (1 + cfg.SCOPE_EXPANSION_CHAR_PCT / 100)) {
      const charDiff = newReqLen - oldReqLen;
      shifts.push({
        field: 'requirements',
        description: `Substantial requirements scope expansion (+${charDiff} characters, +${Math.round((charDiff / oldReqLen) * 100)}%)`,
        severity: 'moderate',
        riskPoints: cfg.WEIGHTS.SCOPE_EXPANSION,
        previousValue: oldReqLen,
        newValue: newReqLen
      });
      riskScoreIncrease += cfg.WEIGHTS.SCOPE_EXPANSION;
    }

    // 4. Title Change & Seniority Downgrade
    if (oldJob.title && newJob.title && oldJob.title.trim().toLowerCase() !== newJob.title.trim().toLowerCase()) {
      const oldSeniority = extractSeniority(oldJob.title);
      const newSeniority = extractSeniority(newJob.title);

      const isDowngrade = oldSeniority !== null && newSeniority !== null && newSeniority < oldSeniority;
      shifts.push({
        field: 'title',
        description: isDowngrade
          ? `Seniority downgrade in title: "${oldJob.title}" ➔ "${newJob.title}"`
          : `Job title modified: "${oldJob.title}" ➔ "${newJob.title}"`,
        severity: isDowngrade ? 'high_bait_and_switch' : 'low',
        riskPoints: cfg.WEIGHTS.TITLE_CHANGE,
        previousValue: oldJob.title,
        newValue: newJob.title
      });
      riskScoreIncrease += cfg.WEIGHTS.TITLE_CHANGE;
    }

    // 5. Workplace Type Change (e.g. Remote to On-Site)
    const oldWorkplace = oldJob.workplaceType || oldJob.parsedCriteria?.workplaceType;
    const newWorkplace = newJob.workplaceType || newJob.parsedCriteria?.workplaceType;
    if (oldWorkplace && newWorkplace && oldWorkplace !== newWorkplace) {
      const isRemoteToOnsite = oldWorkplace === 'Remote' && newWorkplace === 'On-Site';
      const isRemoteToHybrid = oldWorkplace === 'Remote' && newWorkplace === 'Hybrid';
      const severity = isRemoteToOnsite ? 'high_bait_and_switch' : (isRemoteToHybrid ? 'moderate' : 'low');
      const points = isRemoteToOnsite ? cfg.WEIGHTS.LOCATION_CHANGE_HIGH : cfg.WEIGHTS.LOCATION_CHANGE_MODERATE;

      shifts.push({
        field: 'workplaceType',
        description: `Workplace policy shift: ${oldWorkplace} ➔ ${newWorkplace}`,
        severity,
        riskPoints: points,
        previousValue: oldWorkplace,
        newValue: newWorkplace
      });
      riskScoreIncrease += points;
    }

    // 6. Company Name Verification/Correction
    if (oldJob.companyName && newJob.companyName && oldJob.companyName.trim() !== newJob.companyName.trim()) {
      shifts.push({
        field: 'companyName',
        description: `Verified hiring entity: "${oldJob.companyName}" ➔ "${newJob.companyName}"`,
        severity: 'low',
        riskPoints: 0,
        previousValue: oldJob.companyName,
        newValue: newJob.companyName
      });
    }

    // 7. Staffing / Recruiter Firm Agency Verification
    const oldFirm = (oldJob.posterFirmName || '').trim();
    const newFirm = (newJob.posterFirmName || '').trim();
    if (oldFirm !== newFirm) {
      shifts.push({
        field: 'posterFirmName',
        description: `Recruiting firm representation updated: "${oldFirm || 'Direct Hire'}" ➔ "${newFirm || 'Direct Hire'}"`,
        severity: 'low',
        riskPoints: 0,
        previousValue: oldFirm || 'Direct Hire',
        newValue: newFirm || 'Direct Hire'
      });
    }
  }

  // 6. Cultural Red Flag Phrase Detection in Description/Requirements
  const textToScan = `${newJob.description || ''} ${newJob.requirements || ''}`.toLowerCase();
  const CULTURAL_RED_FLAGS = [
    { phrase: 'we are a family', note: 'Red Flag: "We are a family" masks poor boundaries. Preferred: Ecosystem with mutual respect.' },
    { phrase: 'work hard play hard', note: 'Red Flag: "Work hard play hard" often signals unpaced hustle culture.' },
    { phrase: 'relentless hustle', note: 'Red Flag: "Relentless hustle" violates pacing & rest principles.' },
    { phrase: 'results matter feelings don', note: 'Red Flag: Violates gracious professionalism (Excellence & Empathy).' },
    { phrase: 'failure is not an option', note: 'Red Flag: Penalizes early accountability and experimentation.' }
  ];

  CULTURAL_RED_FLAGS.forEach(rf => {
    if (textToScan.includes(rf.phrase)) {
      shifts.push({
        field: 'requirements',
        description: rf.note,
        severity: 'moderate',
        riskPoints: 10,
        newValue: rf.phrase
      });
      riskScoreIncrease += 10;
    }
  });

  // Calculate Aggregates
  const prevRiskScore = oldJob?.nefariousRiskScore || 0;
  const totalRiskScore = Math.min(cfg.RISK_SCORE_MAX, prevRiskScore + riskScoreIncrease);

  let flaggedRiskLevel: 'low' | 'moderate' | 'high_bait_and_switch' = 'low';
  if (shifts.some(s => s.severity === 'high_bait_and_switch')) {
    flaggedRiskLevel = 'high_bait_and_switch';
  } else if (shifts.some(s => s.severity === 'moderate')) {
    flaggedRiskLevel = 'moderate';
  }

  let transparencyRating: 'verified_transparent' | 'minor_edits' | 'under_review' | 'flagged' = 'verified_transparent';
  if (totalRiskScore >= cfg.FLAGGED_SCORE_THRESHOLD) {
    transparencyRating = 'flagged';
  } else if (totalRiskScore >= cfg.UNDER_REVIEW_SCORE_THRESHOLD) {
    transparencyRating = 'under_review';
  } else if (shifts.length > 0 || (oldJob?.revisions && oldJob.revisions.length > 0)) {
    transparencyRating = 'minor_edits';
  }

  const nextVersionNumber = calculateSemanticVersion(oldJob?.currentVersion || 'v1.0.0', flaggedRiskLevel);

  return {
    shifts,
    riskScoreIncrease,
    totalRiskScore,
    flaggedRiskLevel,
    transparencyRating,
    nextVersionNumber
  };
}

/**
 * Calculates semantic version bump:
 * - High bait-and-switch: Major bump (e.g. v1.2.0 -> v2.0.0)
 * - Moderate shift: Minor bump (e.g. v1.2.0 -> v1.3.0)
 * - Low/Non-material: Patch bump (e.g. v1.2.0 -> v1.2.1)
 */
export function calculateSemanticVersion(
  currentVersion = 'v1.0.0',
  riskLevel: 'low' | 'moderate' | 'high_bait_and_switch'
): string {
  const clean = currentVersion.replace(/^v/, '');
  const parts = clean.split('.').map(p => parseInt(p, 10) || 0);

  let major = parts[0] ?? 1;
  let minor = parts[1] ?? 0;
  let patch = parts[2] ?? 0;

  if (riskLevel === 'high_bait_and_switch') {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (riskLevel === 'moderate') {
    minor += 1;
    patch = 0;
  } else {
    patch += 1;
  }

  return `v${major}.${minor}.${patch}`;
}
