/**
 * Static Configuration & Safety Upper Bounds (NASA JPL Rule 8 & ITIL Asset Management)
 */

export const STATIC_CONFIG = {
  APP: {
    NAME: 'Ascend ATS',
    VERSION: '0.5.30',
    PARTNER_NAME: 'RapportVerse',
    PARTNER_URL: 'https://rapprt.space',
    CREATOR: 'Chris Barnes',
    CONTACT_EMAIL: 'Chris.Barnes.2000@me.com',
  },
  SAFETY_LIMITS: {
    MAX_IMPORT_ROWS: 2500,
    MAX_ITERATION_CEILING: 1000,
    MAX_BATCH_SIZE: 500,
    MAX_ATTACHMENT_SIZE_MB: 10,
    MAX_JSON_PAYLOAD_BYTES: 5 * 1024 * 1024, // 5 MB
    MAX_JSON_DEPTH: 20,
    MAX_ARRAY_ITEMS: 500,
  },
  DEDUP: {
    HASH_PREFIX_LENGTH: 16,
    DEFAULT_TTL_DAYS: 90,
    STRIPPED_QUERY_PARAMS: [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'ref', 'reference', 'fbclid', 'gclid', 'msclkid', 'source', 'trk', 'tracking'
    ],
    PRESERVED_JOB_PARAMS: ['jk', 'jobId', 'id', 'vjk'],
  },
  ROLE_SWITCH_LIMITS: {
    MAX_SWITCHES_PER_24H: 3,
    WINDOW_HOURS: 24,
  },
  MATERIAL_SHIFT_THRESHOLDS: {
    MAX_SALARY_DROP_PCT: 5,
    MIN_SALARY_DROP_PCT: 10,
    SCOPE_EXPANSION_CHAR_PCT: 20,
    MIN_SCOPE_LENGTH: 50,
    WEIGHTS: {
      HIGH_BAIT_AND_SWITCH: 40,
      MIN_SALARY_DROP: 25,
      SCOPE_EXPANSION: 15,
      TITLE_CHANGE: 10,
      LOCATION_CHANGE_HIGH: 20,
      LOCATION_CHANGE_MODERATE: 10,
    },
    RISK_SCORE_MAX: 100,
    FLAGGED_SCORE_THRESHOLD: 35,
    UNDER_REVIEW_SCORE_THRESHOLD: 15,
  },
  MAISTER_TRUST_BOUNDS: {
    MIN_SELF_ORIENTATION: 1.0,
    MAX_SELF_ORIENTATION: 10.0,
    MIN_FACTOR_SCORE: 1.0,
    MAX_FACTOR_SCORE: 10.0,
  },
  DUNBAR_TIERS: {
    CORE: 5,
    MENTORS: 15,
    TALENT: 50,
    EXTENDED: 150,
  },
  PRIVACY_CLOAK_LEVELS: {
    UNRESTRICTED: 1,
    STANDARD: 2,
    HIGH: 3,
    MAXIMUM: 4,
  },
} as const;
