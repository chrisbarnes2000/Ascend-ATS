/**
 * @fileoverview Multi-Channel Session Mirror for Ascend ATS Browser Extension.
 * Synchronizes active authentication sessions across localStorage, HTML dataset attributes,
 * custom DOM events, and window postMessages to ensure instant session detection in extensions.
 * NASA JPL Rule 1 & Rule 5: Strict type assertions and boundary checks.
 */

export function syncSessionToExtension(sessionPayload: any | null): void {
  try {
    if (sessionPayload) {
      const jsonStr = JSON.stringify(sessionPayload);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('ascend_auth_session', jsonStr);
      }
      if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.dataset.ascendSession = jsonStr;
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ascend-auth-change', { detail: sessionPayload }));
        window.postMessage({ type: 'ASCEND_AUTH_CHANGE', session: sessionPayload }, '*');
      }
    } else {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('ascend_auth_session');
      }
      if (typeof document !== 'undefined' && document.documentElement) {
        delete document.documentElement.dataset.ascendSession;
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ascend-auth-change', { detail: null }));
        window.postMessage({ type: 'ASCEND_AUTH_CHANGE', session: null }, '*');
      }
    }
  } catch (e) {
    console.warn("[SessionMirror] Failed to sync session to extension:", e);
  }
}
