/**
 * Location and Workplace Requirements Parser & Sanitizer
 * NASA JPL Rule 1 & Rule 2: Deterministic control flow and bounded evaluation.
 * Detects:
 * - Multi-location requisitions and discrete site extraction
 * - Candidate preference alignment and prioritization
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
  // Multi-location enhancements (Approach A)
  allLocations: string[];
  isMultiLocation: boolean;
  matchedPreferredLocation?: string;
  additionalLocationsCount: number;
  rawLocationDisplay: string;
}

export interface CandidateLocationPreferences {
  targetLocations?: Array<string | { description?: string; placeId?: string }>;
  preferredLocations?: string[];
  location?: string;
  personalInfo?: {
    location?: string;
  };
}

const MAX_LOCATIONS_BOUND = 25;

/**
 * Normalizes single location strings (e.g., standardizing State codes and trimming noise)
 */
export function normalizeSingleLocation(loc: string): string {
  if (!loc || typeof loc !== 'string') return '';
  const trimmed = loc
    .replace(/^(?:location|office|based in|job location|work location)\s*[:\-]\s*/i, '')
    .replace(/[;,\.]$/, '')
    .trim();

  if (trimmed.length < 2) return '';

  // Standardize lowercase state abbreviation (e.g. "Seattle, wa" -> "Seattle, WA")
  return trimmed.replace(/,\s*([a-z]{2})$/i, (_, st: string) => `, ${st.toUpperCase()}`);
}

/**
 * Extracts candidate preferred location strings from profile preferences
 */
function extractCandidateLocationStrings(prefs?: CandidateLocationPreferences | null): string[] {
  if (!prefs) return [];
  const results: string[] = [];

  if (Array.isArray(prefs.targetLocations)) {
    for (let i = 0; i < prefs.targetLocations.length && i < MAX_LOCATIONS_BOUND; i++) {
      const item = prefs.targetLocations[i];
      if (typeof item === 'string' && item.trim()) {
        results.push(item.trim());
      } else if (item && typeof item === 'object' && typeof item.description === 'string' && item.description.trim()) {
        results.push(item.description.trim());
      }
    }
  }

  if (Array.isArray(prefs.preferredLocations)) {
    for (let i = 0; i < prefs.preferredLocations.length && i < MAX_LOCATIONS_BOUND; i++) {
      const loc = prefs.preferredLocations[i];
      if (typeof loc === 'string' && loc.trim() && !results.includes(loc.trim())) {
        results.push(loc.trim());
      }
    }
  }

  if (prefs.location && typeof prefs.location === 'string' && prefs.location.trim()) {
    if (!results.includes(prefs.location.trim())) {
      results.push(prefs.location.trim());
    }
  }

  if (prefs.personalInfo?.location && typeof prefs.personalInfo.location === 'string' && prefs.personalInfo.location.trim()) {
    if (!results.includes(prefs.personalInfo.location.trim())) {
      results.push(prefs.personalInfo.location.trim());
    }
  }

  return results;
}

/**
 * Checks if a job location matches a candidate's preferred location
 */
export function doesLocationMatchPreference(
  jobLocation: string,
  preferredLocation: string
): boolean {
  if (!jobLocation || !preferredLocation) return false;
  const normJob = jobLocation.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
  const normPref = preferredLocation.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();

  if (normJob === normPref) return true;
  if (normJob.includes(normPref) || normPref.includes(normJob)) return true;

  // City token match (e.g. "seattle" matches "seattle wa")
  const jobTokens = normJob.split(' ').filter(t => t.length > 2 && t !== 'usa' && t !== 'united' && t !== 'states');
  const prefTokens = normPref.split(' ').filter(t => t.length > 2 && t !== 'usa' && t !== 'united' && t !== 'states');

  for (let i = 0; i < jobTokens.length && i < MAX_LOCATIONS_BOUND; i++) {
    const token = jobTokens[i];
    if (prefTokens.includes(token)) return true;
  }

  return false;
}

/**
 * Splits raw location text or array into clean, distinct locations
 */
export function extractDistinctLocations(
  rawLoc: string,
  locationsArray?: string[]
): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  const addLocation = (loc: string) => {
    const norm = normalizeSingleLocation(loc);
    if (!norm) return;
    const lower = norm.toLowerCase();
    // Exclude generic placeholder tokens if we have real cities
    if (['multiple locations', 'various', 'various locations', 'tbd', 'anywhere'].includes(lower)) {
      return;
    }
    if (!seen.has(lower) && result.length < MAX_LOCATIONS_BOUND) {
      seen.add(lower);
      result.push(norm);
    }
  };

  // 1. Process explicit array if provided
  if (Array.isArray(locationsArray) && locationsArray.length > 0) {
    for (let i = 0; i < locationsArray.length && i < MAX_LOCATIONS_BOUND; i++) {
      addLocation(locationsArray[i]);
    }
    if (result.length > 0) return result;
  }

  const cleanRaw = (rawLoc || '')
    .replace(/^(?:multiple\s+locations?|various\s+locations?|job\s+locations?|office\s+locations?|locations?|based\s+in)\s*[:\-]\s*/i, '')
    .trim();

  if (!cleanRaw) return [];

  // 2. Delimiter-based splitting
  let parts: string[] = [];
  if (cleanRaw.includes(';')) {
    parts = cleanRaw.split(';');
  } else if (cleanRaw.includes('|')) {
    parts = cleanRaw.split('|');
  } else if (cleanRaw.includes('•') || cleanRaw.includes('·')) {
    parts = cleanRaw.split(/[•·]/);
  } else if (cleanRaw.includes('\n')) {
    parts = cleanRaw.split('\n');
  } else if (/\s+[\/\\]\s+/.test(cleanRaw)) {
    parts = cleanRaw.split(/\s+[\/\\]\s+/);
  } else if (/\s+(?:or|and)\s+/i.test(cleanRaw) && /,\s*[A-Z]{2}/.test(cleanRaw)) {
    parts = cleanRaw.split(/\s+(?:or|and)\s+/i);
  } else if (cleanRaw.includes(',')) {
    // Comma-separated list of cities with states: e.g. "Charlotte, NC, New York, NY, Dallas, TX"
    const cityStateMatches = cleanRaw.match(/[A-Za-z\s.-]+,\s*[A-Za-z]{2}(?:\s*,\s*USA?)?/g);
    if (cityStateMatches && cityStateMatches.length > 1) {
      parts = cityStateMatches;
    } else {
      parts = [cleanRaw];
    }
  } else {
    parts = [cleanRaw];
  }

  for (let i = 0; i < parts.length && i < MAX_LOCATIONS_BOUND; i++) {
    addLocation(parts[i]);
  }

  return result;
}

export function parseAndSanitizeLocationAndWorkplace(
  job: {
    title?: string;
    companyName?: string;
    location?: string;
    locations?: string[];
    workplaceType?: string;
    description?: string;
    requirements?: string;
    parsedCriteria?: {
      location?: string;
      locations?: string[];
      workplaceType?: string;
    };
  },
  candidatePreferences?: CandidateLocationPreferences | null
): SanitizedLocationWorkplace {
  const title = (job.title || '').trim();
  const company = (job.companyName || '').trim();
  const rawLoc = (job.location || job.parsedCriteria?.location || '').trim();
  const explicitLocations = (job.locations && job.locations.length > 0)
    ? job.locations
    : (job.parsedCriteria?.locations && job.parsedCriteria.locations.length > 0)
    ? job.parsedCriteria.locations
    : undefined;

  const desc = (job.description || '').trim();
  const reqs = (job.requirements || '').trim();
  const combinedText = `${title} ${company} ${rawLoc} ${desc} ${reqs}`.toLowerCase();

  // 1. Extract Distinct Discrete Locations
  let distinctLocations = extractDistinctLocations(rawLoc, explicitLocations);

  // Tacoma / TPU Entity Normalization (Strictly for municipal employer roles or missing location)
  const isTpuOrTacoma =
    company.toLowerCase().includes('tacoma public utilities') ||
    company.toLowerCase().includes('city of tacoma') ||
    company.toLowerCase().includes('tacoma power') ||
    company.toLowerCase().includes('tacoma water') ||
    company.toLowerCase().includes('pierce county') ||
    company.toLowerCase().includes('tpu') ||
    (desc.toLowerCase().includes('tacoma public utilities') && !company) ||
    (desc.toLowerCase().includes('city of tacoma') && !company);

  if (isTpuOrTacoma) {
    if (
      distinctLocations.length === 0 ||
      distinctLocations.some(l => {
        const lower = l.toLowerCase();
        return lower.includes('tacoma') || lower === 'remote' || lower === 'washington';
      })
    ) {
      distinctLocations = ['Tacoma, WA'];
    }
  } else if (distinctLocations.length === 0) {
    if (combinedText.includes('tukwila') || company.toLowerCase().includes('salal credit union')) {
      distinctLocations = ['Tukwila, WA'];
    } else if (combinedText.includes('olympia')) {
      distinctLocations = ['Olympia, WA'];
    } else if (combinedText.includes('seattle')) {
      distinctLocations = ['Seattle, WA'];
    } else if (combinedText.includes('remote')) {
      distinctLocations = ['Remote (US)'];
    } else {
      distinctLocations = ['Washington'];
    }
  }

  // 2. Candidate Preference Alignment
  const candidateLocStrings = extractCandidateLocationStrings(candidatePreferences);
  let matchedPreferredLocation: string | undefined = undefined;

  if (candidateLocStrings.length > 0 && distinctLocations.length > 0) {
    for (let c = 0; c < candidateLocStrings.length && c < MAX_LOCATIONS_BOUND; c++) {
      const pref = candidateLocStrings[c];
      const match = distinctLocations.find(loc => doesLocationMatchPreference(loc, pref));
      if (match) {
        matchedPreferredLocation = match;
        // Prioritize matched location at index 0 for primary display
        distinctLocations = [match, ...distinctLocations.filter(l => l !== match)];
        break;
      }
    }
  }

  const isMultiLocation = distinctLocations.length > 1;
  const additionalLocationsCount = Math.max(0, distinctLocations.length - 1);
  const primaryLocation = distinctLocations[0] || 'Washington';
  const rawLocationDisplay = distinctLocations.join(', ');

  // 3. Detect Travel & Customer Visit Requirements
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

  for (let i = 0; i < travelCustomerPatterns.length && i < MAX_LOCATIONS_BOUND; i++) {
    const pattern = travelCustomerPatterns[i];
    if (pattern.test(combinedText)) {
      hasTravelRequirement = true;
      travelRequirement = 'Travel to customer sites required';
      break;
    }
  }

  // 4. Detect Partial In-Office / Hybrid Presence
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

  for (let i = 0; i < inOfficePatterns.length && i < MAX_LOCATIONS_BOUND; i++) {
    const pattern = inOfficePatterns[i];
    if (pattern.test(combinedText)) {
      hasPartialInOffice = true;
      break;
    }
  }

  if (isTpuOrTacoma && (hasTravelRequirement || hasPartialInOffice || combinedText.includes('telework') || combinedText.includes('travel') || combinedText.includes('partial'))) {
    hasPartialInOffice = true;
  }

  // 5. Resolve Workplace Type
  let resolvedType: 'Remote' | 'Hybrid' | 'On-Site' = 'Remote';

  if (hasTravelRequirement || hasPartialInOffice) {
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
    resolvedType = isTpuOrTacoma ? 'Hybrid' : 'Remote';
  }

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
    location: primaryLocation,
    travelRequirement,
    hasTravelRequirement,
    isHybridNotice,
    workplaceSummary,
    allLocations: distinctLocations,
    isMultiLocation,
    matchedPreferredLocation,
    additionalLocationsCount,
    rawLocationDisplay
  };
}
