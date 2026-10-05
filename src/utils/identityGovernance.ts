import { AccountType } from '../types';
import { STATIC_CONFIG } from '../config';

/**
 * Identity & Role Governance Utilities
 * Adheres to NASA JPL Power of 10 Safety Rules (<60 lines per function, strict bounds)
 */

export interface RoleSwitchHistoryItem {
  role: AccountType;
  timestamp: any;
}

export interface RateLimitCheckResult {
  allowed: boolean;
  count: number;
  remaining: number;
  retryAfterMs?: number;
}

/**
 * Normalizes email address to lowercase and trimmed string.
 * Preserves plus-tagging while preventing casing duplicate collisions.
 */
export function normalizeEmail(email: string | null | undefined): string {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

/**
 * Validates email against standard RFC 5322 baseline.
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim();
  if (normalized.length > 254) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(normalized);
}

/**
 * Evaluates role switch throttle (Max 3 switches per 24 hours per user).
 */
export function checkRoleSwitchRateLimit(
  history: RoleSwitchHistoryItem[] | undefined,
  maxAllowed = STATIC_CONFIG.ROLE_SWITCH_LIMITS.MAX_SWITCHES_PER_24H,
  windowHours = STATIC_CONFIG.ROLE_SWITCH_LIMITS.WINDOW_HOURS
): RateLimitCheckResult {
  if (!history || !Array.isArray(history) || history.length === 0) {
    return { allowed: true, count: 0, remaining: maxAllowed };
  }

  const now = Date.now();
  const windowMs = windowHours * 60 * 60 * 1000;
  const windowStart = now - windowMs;

  const validEntries = history
    .map(entry => {
      if (entry.timestamp && typeof entry.timestamp.toMillis === 'function') {
        return entry.timestamp.toMillis();
      }
      if (entry.timestamp instanceof Date) {
        return entry.timestamp.getTime();
      }
      if (typeof entry.timestamp === 'number') {
        return entry.timestamp;
      }
      return 0;
    })
    .filter(ts => ts >= windowStart)
    .sort((a, b) => a - b);

  const count = validEntries.length;
  if (count >= maxAllowed) {
    const oldestInWindow = validEntries[0];
    const retryAfterMs = Math.max(0, (oldestInWindow + windowMs) - now);
    return {
      allowed: false,
      count,
      remaining: 0,
      retryAfterMs
    };
  }

  return {
    allowed: true,
    count,
    remaining: maxAllowed - count
  };
}

/**
 * Generates the atomic archival Firestore document path for superseded roles.
 */
export function generateArchiveProfilePath(uid: string, role: string, timestamp = Date.now()): string {
  const safeRole = role.replace(/[^a-zA-Z0-9_-]/g, '');
  return `users/${uid}/profiles/archived/${safeRole}_${timestamp}`;
}
