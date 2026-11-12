/**
 * @fileoverview Authentication and Session Manager for Ascend ATS Extension.
 * Handles reading, cross-tab synchronization, and RBAC privilege checks.
 * NASA JPL Rule 5 & Rule 7: Strict defensive validation and return value checking.
 */

import { APP_BASE_URL } from './constants.js';

/**
 * Evaluates whether an authenticated user session is authorized for a specific role suite.
 * Enforces strict Role-Based Access Control (RBAC).
 *
 * @param {Object|null} session - Active user session payload from chrome.storage or web app.
 * @param {'seeker'|'recruiter'|'admin'} targetRole - The role space to inspect.
 * @returns {boolean} True if the user account holds valid privileges for the requested role.
 */
export function canAccessRole(session, targetRole) {
  if (!session || typeof session !== 'object') {
    return false;
  }

  // Master Platform Architect Override
  const isMasterAdmin = Boolean(
    session.isAdmin || session.email === 'Chris.Barnes.2000@me.com'
  );
  if (isMasterAdmin) {
    return true;
  }

  if (targetRole === 'seeker') {
    return true;
  }

  if (targetRole === 'recruiter') {
    return Boolean(
      session.accountType === 'company' ||
      session.accountType === 'recruiter' ||
      session.accountType === 'staffingFirm'
    );
  }

  // Admin access restricted exclusively to master architect
  if (targetRole === 'admin') {
    return false;
  }

  return false;
}

/**
 * Inspects all browser tabs for an active Ascend ATS session in localStorage.
 * If found, persists the credentials to chrome.storage.local and triggers callback.
 *
 * @param {boolean} [openIfNotPresent=false] - Whether to launch the Ascend login page if no tab exists.
 * @param {function(Object): void} onAuthenticated - Callback executed when a valid session is discovered.
 * @param {function(): void} onUnauthenticated - Callback executed when no session is available.
 * @returns {Promise<void>}
 */
export async function trySyncSessionFromTabs(
  openIfNotPresent = false,
  onAuthenticated = () => {},
  onUnauthenticated = () => {}
) {
  try {
    const tabs = await chrome.tabs.query({ url: "*://*/*" });
    const ascendTab = tabs.find(t => t.url && (
      t.url.includes('ascend-ats.ai.studio') ||
      t.url.includes('ais-') ||
      t.url.includes('localhost:3000')
    ));

    if (ascendTab && ascendTab.id) {
      if (chrome.scripting && typeof chrome.scripting.executeScript === 'function') {
        chrome.scripting.executeScript({
          target: { tabId: ascendTab.id },
          func: () => localStorage.getItem('ascend_auth_session')
        }, (results) => {
          if (results && results[0] && results[0].result) {
            try {
              const session = JSON.parse(results[0].result);
              chrome.storage.local.set({ ascendSession: session }, () => {
                onAuthenticated(session);
              });
            } catch (parseErr) {
              console.warn("[AuthManager] Malformed session JSON in tab localStorage:", parseErr);
              onUnauthenticated();
            }
          } else {
            if (openIfNotPresent) {
              chrome.tabs.update(ascendTab.id, { active: true });
              chrome.tabs.create({ url: `${APP_BASE_URL}/#login` });
            } else {
              onUnauthenticated();
            }
          }
        });
      } else {
        onUnauthenticated();
      }
    } else {
      if (openIfNotPresent) {
        chrome.tabs.create({ url: `${APP_BASE_URL}/#login` });
      } else {
        onUnauthenticated();
      }
    }
  } catch (err) {
    console.warn("[AuthManager] Tab inspection error:", err);
    onUnauthenticated();
  }
}

/**
 * Purges cached session tokens from local extension storage.
 *
 * @param {function(): void} onSignedOut - Callback executed once storage keys are removed.
 */
export function signOutSession(onSignedOut) {
  chrome.storage.local.remove(['ascendSession'], () => {
    if (typeof onSignedOut === 'function') {
      onSignedOut();
    }
  });
}
