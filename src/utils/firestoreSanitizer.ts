/**
 * Firestore Payload Sanitizer Utility
 * 
 * Compliant with NASA JPL Rule #5 (High Assertion & Invariant Density)
 * and Rule #7 (Strict Parameter & Return Value Checking).
 * 
 * Recursively strips 'undefined' fields and invalid values before sending
 * to Firestore setDoc/addDoc/updateDoc operations.
 */

export function isFieldValueSentinel(val: any): boolean {
  if (!val || typeof val !== 'object') return false;
  // Check for Firestore FieldValue sentinels (serverTimestamp, deleteField, etc.)
  if (val.constructor && (val.constructor.name === 'FieldValue' || val.constructor.name.includes('FieldValue'))) {
    return true;
  }
  if ('_methodName' in val || '_delegate' in val) {
    return true;
  }
  // Check for Firestore Timestamp
  if (typeof val.toMillis === 'function' || typeof val.toDate === 'function') {
    return true;
  }
  return false;
}

export function sanitizeFirestorePayload<T extends Record<string, any>>(data: T): Partial<T> {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => (item !== null && typeof item === 'object' && !isFieldValueSentinel(item) && !(item instanceof Date) ? sanitizeFirestorePayload(item) : item)) as any;
  }

  const clean: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    // Drop all undefined keys unconditionally to prevent Firestore setDoc errors
    if (value === undefined) {
      continue;
    }

    if (value === null) {
      clean[key] = null;
    } else if (isFieldValueSentinel(value) || value instanceof Date) {
      // Preserve Firestore FieldValue and Date objects as-is
      clean[key] = value;
    } else if (Array.isArray(value)) {
      clean[key] = value
        .filter((item) => item !== undefined)
        .map((item) => (item !== null && typeof item === 'object' && !isFieldValueSentinel(item) && !(item instanceof Date) ? sanitizeFirestorePayload(item) : item));
    } else if (typeof value === 'object') {
      const sanitizedNested = sanitizeFirestorePayload(value);
      if (Object.keys(sanitizedNested).length > 0) {
        clean[key] = sanitizedNested;
      }
    } else {
      clean[key] = value;
    }
  }

  return clean as Partial<T>;
}
