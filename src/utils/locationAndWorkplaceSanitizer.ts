/**
 * Location and Workplace Requirements Parser & Sanitizer
 * NASA JPL Rule 1 & Rule 2: Deterministic control flow and bounded evaluation.
 * Detects:
 * - Hybrid requirements (partial in-office, customer travel, telework with in-person needs)
 * - Travel requirements (customer site visits, client visits, regional travel)
 * - Sanitizes municipal locations (e.g. City of Tacoma / TPU -> Tacoma, WA)
 */

export interface SanitizedLocationWorkplace {
  workplaceType: 'Remote' | 'Hybrid' | 'On-Site';
  location: string;
  travelRequirement?: string;
  hasTravelRequirement: boolean;
  isHybridNotice: boolean;
  workplaceSummary: string;
}

export function parseAndSanitizeLocationAndWorkplace(job: {
  title?: string;
  companyName?: string;
  location?: string;
  workplaceType?: string;
  description?: string;
  requirements?: string;
}): SanitizedLocationWorkplace {
  const title = (job.title || '').trim();
  const company = (job.companyName || '').trim();
  const rawLoc = (job.location || '').trim();
  const desc = (job.description || '').trim();
  const reqs = (job.requirements || '').trim();

  const combinedText = `${title} ${company} ${rawLoc} ${desc} ${reqs}`.toLowerCase();

  // 1. Sanitize Location String
  let sanitizedLocation = rawLoc
    .replace(/^(location|office|based in|job location|work location)\s*[:\-]\s*/i, '')
    .trim();

  // Tacoma / TPU Entity Normalization
  if (
    combinedText.includes('tacoma public utilities') ||
    combinedText.includes('city of tacoma') ||
    combinedText.includes('tacoma power') ||
    combinedText.includes('tacoma water') ||
    combinedText.includes('pierce county') ||
    combinedText.includes('tpu')
  ) {
    sanitizedLocation = 'Tacoma, WA';
  } else if (combinedText.includes('tukwila') || combinedText.includes('salal credit union')) {
    sanitizedLocation = 'Tukwila, WA';
  } else if (combinedText.includes('seattle')) {
    sanitizedLocation = 'Seattle, WA';
  } else if (combinedText.includes('olympia')) {
    sanitizedLocation = 'Olympia, WA';
  }

  // Fallback if empty or vague
  if (!sanitizedLocation || sanitizedLocation.toLowerCase() === 'location' || sanitizedLocation.length < 2) {
    if (combinedText.includes('remote')) {
      sanitizedLocation = 'Remote (US)';
    } else {
      sanitizedLocation = 'Washington';
    }
  }

  // 2. Detect Travel & Customer Visit Requirements
  let hasTravelRequirement = false;
  let travelRequirement: string | undefined = undefined;

  const travelCustomerPatterns = [
    /travel\s+to\s+customers?/i,
    /travel\s+to\s+clients?/i,
    /customer\s+(?:site\s+)?visits?/i,
    /client\s+(?:site\s+)?visits?/i,
    /field\s+(?:visits?|work|operations?|service)/i,
    /travel\s+required/i,
    /travel\s+up\s+to\s+\d+%/i,
    /requires\s+(?:regular\s+|occasional\s+|frequent\s+)?travel/i,
    /visiting\s+(?:customer|client|facility)\s+sites?/i,
    /on-site\s+customer\s+support/i,
    /travel\s+(?:throughout|across|within)\s+(?:tacoma|pierce|service\s+territory|wa|washington)/i,
    /driving\s+to\s+customers?/i
  ];

  for (const pattern of travelCustomerPatterns) {
    if (pattern.test(combinedText)) {
      hasTravelRequirement = true;
      travelRequirement = 'Travel to customer sites required';
      break;
    }
  }

  // 3. Detect Partial In-Office / Hybrid Presence
  let hasPartialInOffice = false;
  const inOfficePatterns = [
    /partial(?:ly)?\s+in[- ]office/i,
    /partial(?:ly)?\s+remote/i,
    /hybrid/i,
    /in[- ]office\s+(?:\d+|days|required|presence|schedule)/i,
    /\d+\s+days\s+in[- ]office/i,
    /(?:some|occasional|periodic)\s+in[- ]office/i,
    /telework\s+(?:agreement|eligible|policy|option)/i,
    /office\s+presence\s+required/i,
    /in[- ]person\s+(?:meetings?|collaboration|training|work)/i,
    /must\s+reside\s+in\s+washington/i,
    /within\s+(?:\d+|commuting)\s+miles/i,
    /hybrid\s+(?:schedule|model|work|arrangement)/i
  ];

  for (const pattern of inOfficePatterns) {
    if (pattern.test(combinedText)) {
      hasPartialInOffice = true;
      break;
    }
  }

  // Tacoma / TPU Government Roles: TPU roles out of City of Tacoma with travel or telework are Hybrid
  const isTpuOrTacoma =
    combinedText.includes('tacoma public utilities') ||
    combinedText.includes('city of tacoma') ||
    combinedText.includes('tacoma power') ||
    combinedText.includes('tacoma water') ||
    combinedText.includes('tpu');

  if (isTpuOrTacoma && (hasTravelRequirement || hasPartialInOffice || combinedText.includes('telework') || combinedText.includes('travel') || combinedText.includes('partial'))) {
    hasPartialInOffice = true;
  }

  // 4. Resolve Workplace Type
  let resolvedType: 'Remote' | 'Hybrid' | 'On-Site' = 'Remote';

  if (hasTravelRequirement || hasPartialInOffice) {
    // If travel to customers or partial in-office is required, it must be marked as Hybrid
    resolvedType = 'Hybrid';
  } else if (
    combinedText.includes('100% on-site') ||
    combinedText.includes('on-site only') ||
    combinedText.includes('onsite only') ||
    combinedText.includes('strictly on-site') ||
    (isTpuOrTacoma && !combinedText.includes('remote') && !combinedText.includes('telework'))
  ) {
    resolvedType = 'On-Site';
  } else if (
    combinedText.includes('100% remote') ||
    combinedText.includes('fully remote') ||
    (combinedText.includes('remote') && !hasTravelRequirement && !hasPartialInOffice)
  ) {
    resolvedType = 'Remote';
  } else if (job.workplaceType === 'Hybrid' || job.workplaceType === 'On-Site' || job.workplaceType === 'Remote') {
    resolvedType = job.workplaceType;
  } else {
    // Default safe classification for local municipal/facility positions
    resolvedType = isTpuOrTacoma ? 'Hybrid' : 'Remote';
  }

  // Flag if role has hybrid notice
  const isHybridNotice = resolvedType === 'Hybrid';

  const workplaceSummary = hasTravelRequirement && hasPartialInOffice
    ? `${resolvedType} • Travel & In-Office`
    : hasTravelRequirement
    ? `${resolvedType} • Travel Required`
    : hasPartialInOffice
    ? `${resolvedType} • Partial In-Office`
    : resolvedType;

  return {
    workplaceType: resolvedType,
    location: sanitizedLocation,
    travelRequirement,
    hasTravelRequirement,
    isHybridNotice,
    workplaceSummary
  };
}
