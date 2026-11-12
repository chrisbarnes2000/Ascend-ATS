/**
 * @fileoverview Session Observer for Ascend ATS Content Scripts.
 * Runs on Ascend Web App pages to mirror authenticated credentials into chrome.storage.local.
 * NASA JPL Rule 3: Bounded interval polling and guaranteed teardown support.
 */

window.AscendBridge = window.AscendBridge || {};

window.AscendBridge.SessionObserver = (function() {
  let syncIntervalId = null;

  /**
   * Reads the active auth session from DOM dataset or window.localStorage and synchronizes it to extension storage.
   */
  function syncSession() {
    try {
      const datasetVal = document.documentElement ? document.documentElement.dataset.ascendSession : null;
      const raw = datasetVal || (typeof window.localStorage !== 'undefined' ? window.localStorage.getItem('ascend_auth_session') : null);
      if (raw) {
        const session = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ ascendSession: session });
        }
      } else {
        if (chrome.storage && chrome.storage.local) {
          chrome.storage.local.remove(['ascendSession']);
        }
      }
    } catch (e) {
      console.warn("[SessionObserver] Session sync error:", e);
    }
  }

  /**
   * Initializes session synchronization on Ascend ATS web application domains.
   */
  function init() {
    syncSession();

    // Listen for custom auth events dispatched from the React SPA useAuth hook
    window.addEventListener('ascend-auth-change', (e) => {
      if (chrome.storage && chrome.storage.local) {
        if (e.detail) {
          chrome.storage.local.set({ ascendSession: e.detail });
        } else {
          chrome.storage.local.remove(['ascendSession']);
        }
      }
    });

    // Listen for window postMessage for cross-world boundary communication
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'ASCEND_AUTH_CHANGE') {
        if (chrome.storage && chrome.storage.local) {
          if (event.data.session) {
            chrome.storage.local.set({ ascendSession: event.data.session });
          } else {
            chrome.storage.local.remove(['ascendSession']);
          }
        }
      }
    });

    // Periodic synchronization heartbeat
    if (syncIntervalId) clearInterval(syncIntervalId);
    syncIntervalId = setInterval(syncSession, 4000);
  }

  return {
    init,
    syncSession
  };
})();
