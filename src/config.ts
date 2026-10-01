/**
 * Static Configuration & Safety Upper Bounds (NASA JPL Rule 8 & ITIL Asset Management)
 */

export const STATIC_CONFIG = {
  APP: {
    NAME: 'Ascend ATS',
    VERSION: '0.5.25',
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
