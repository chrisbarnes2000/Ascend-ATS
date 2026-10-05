import { STATIC_CONFIG } from '../config';

/**
 * Job Posting Deduplication & URL Canonicalization Engine
 * Complies with NASA JPL Rule 1 (deterministic control flow) and Rule 8 (centralized config).
 */

/**
 * Pre-compiled regular expressions for source-specific job identifiers.
 */
export const JOB_ID_EXTRACTORS: Record<string, RegExp[]> = {
  'linkedin.com': [
    /\/jobs\/view\/(\d+)/i,
    /[?&]currentJobId=(\d+)/i,
    /[?&]jobId=(\d+)/i
  ],
  'indeed.com': [
    /[?&]jk=([a-zA-Z0-9]+)/i,
    /[?&]vjk=([a-zA-Z0-9]+)/i,
    /\/viewjob\/.*-([a-zA-Z0-9]{16})/i
  ],
  'governmentjobs.com': [
    /\/jobs\/(\d+)/i,
    /\/careers\/.*\/jobs\/(\d+)/i
  ],
  'greenhouse.io': [
    /\/jobs\/(\d+)/i,
    /[?&]gh_jid=(\d+)/i
  ],
  'lever.co': [
    /\/([0-9a-fA-F-]{36})/i,
    /\/([a-zA-Z0-9_-]{20,})/i
  ],
  'ashbyhq.com': [
    /\/([0-9a-fA-F-]{36})/i,
    /\/([a-zA-Z0-9_-]{12,})/i
  ],
  'workday.com': [
    /\/job\/.*\/([A-Za-z0-9_-]+)$/i,
    /\/job\/.*_([A-Za-z0-9_-]+)/i
  ]
};

/**
 * Computes a deterministic 16-character hex hash from a string.
 * Uses 64-bit FNV-1a variant for zero-dependency browser and Node.js execution.
 */
export function computeDeterministicHash(input: string, length = STATIC_CONFIG.DEDUP.HASH_PREFIX_LENGTH): string {
  if (!input) return '0'.repeat(length);
  
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;

  for (let i = 0; i < input.length && i < 4096; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 0x01000193);
    h2 = Math.imul(h2 ^ ch, 0x85ebca6b);
  }

  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const combined = (hex1 + hex2).toLowerCase();
  return combined.slice(0, length);
}

/**
 * Canonicalizes a job URL to prevent duplicates caused by tracking parameters or trailing slashes.
 */
export function canonicalizeJobUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    let host = parsed.hostname.toLowerCase();
    if (host.startsWith('www.')) {
      host = host.slice(4);
    }

    const strippedParams = new Set<string>(STATIC_CONFIG.DEDUP.STRIPPED_QUERY_PARAMS);
    const preservedParams = new Set<string>(STATIC_CONFIG.DEDUP.PRESERVED_JOB_PARAMS);
    const searchParams = new URLSearchParams();

    // Iterate through params: retain only recognized job params or safe non-tracking params
    parsed.searchParams.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (preservedParams.has(lowerKey)) {
        searchParams.set(lowerKey, value);
      } else if (!strippedParams.has(lowerKey) && !lowerKey.startsWith('utm_')) {
        // Keep non-marketing params
        searchParams.set(key, value);
      }
    });

    let pathname = parsed.pathname;
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    const queryString = searchParams.toString();
    return `https://${host}${pathname}${queryString ? `?${queryString}` : ''}`;
  } catch {
    // If not a valid URL, sanitize and clean trailing slash
    return trimmed.replace(/\/+$/, '').toLowerCase();
  }
}

/**
 * Extracts a robust, source-specific job ID or falls back to a deterministic canonical URL hash.
 * NEVER returns Date.now() or non-deterministic timestamp.
 */
export function extractJobIdentifier(rawUrl: string, contentFallback?: string): string {
  const canonical = canonicalizeJobUrl(rawUrl);

  if (canonical) {
    try {
      const parsed = new URL(canonical);
      const host = parsed.hostname.toLowerCase();

      // Check matched extractors for domain
      for (const [domain, patterns] of Object.entries(JOB_ID_EXTRACTORS)) {
        if (host.includes(domain)) {
          for (const pattern of patterns) {
            const match = canonical.match(pattern);
            if (match && match[1]) {
              return `${domain.split('.')[0]}-${match[1]}`;
            }
          }
        }
      }

      // Check general path segments for clean numeric or uuid tokens
      const pathSegments = parsed.pathname.split('/').filter(Boolean);
      for (let i = pathSegments.length - 1; i >= 0; i--) {
        const seg = pathSegments[i];
        if (/^\d{5,}$/.test(seg)) {
          return `job-${seg}`;
        }
        if (/^[0-9a-fA-F-]{36}$/.test(seg)) {
          return `job-${seg.slice(0, 16)}`;
        }
      }

      // Fall back to canonical URL hash
      return `job-${computeDeterministicHash(canonical)}`;
    } catch {
      return `job-${computeDeterministicHash(canonical)}`;
    }
  }

  // Fallback to text content hash if no URL provided
  if (contentFallback && contentFallback.trim()) {
    return `text-${computeDeterministicHash(contentFallback.trim())}`;
  }

  // Statically bounded fallback
  return `job-${computeDeterministicHash('default_ingested_content')}`;
}

/**
 * Evaluates whether an ingested job has exceeded the 90-day retention TTL window.
 */
export function isJobStale(
  createdAt: any, 
  lastSeenAt: any, 
  ttlDays = STATIC_CONFIG.DEDUP.DEFAULT_TTL_DAYS
): boolean {
  const reference = lastSeenAt || createdAt;
  if (!reference) return false;

  let timeMs = 0;
  if (typeof reference.toMillis === 'function') {
    timeMs = reference.toMillis();
  } else if (reference instanceof Date) {
    timeMs = reference.getTime();
  } else if (typeof reference === 'number') {
    timeMs = reference;
  } else if (typeof reference === 'string') {
    timeMs = new Date(reference).getTime();
  }

  if (!timeMs || isNaN(timeMs)) return false;
  const ttlMs = ttlDays * 24 * 60 * 60 * 1000;
  return (Date.now() - timeMs) > ttlMs;
}
