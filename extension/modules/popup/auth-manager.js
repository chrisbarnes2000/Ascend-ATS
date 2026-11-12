/**
 * @fileoverview Authentication and Session Manager for Ascend ATS Extension.
 * Handles reading, cross-tab synchronization, and RBAC privilege checks with local storage caching.
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

  if (targetRole === 'admin') {
    return false;
  }

  return false;
}

/**
 * Inspects extension storage and active browser tabs for an active Ascend ATS session.
 *
 * @param {boolean} [openIfNotPresent=false] - Whether to launch the Ascend login page if no session exists.
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
    // 1. Primary Check: Check chrome.storage.local cache first for instant login resilience
    const storageRes = await new Promise((resolve) => {
      chrome.storage.local.get(['ascendSession'], resolve);
    });

    if (storageRes && storageRes.ascendSession) {
      onAuthenticated(storageRes.ascendSession);
      return;
    }

    // 2. Secondary Check: Inspect tabs running Ascend ATS for session payload
    const tabs = await chrome.tabs.query({ url: "*://*/*" });
    const ascendTab = tabs.find(t => t.url && (
      t.url.includes('ascend-ats.ai.studio') ||
      t.url.includes('ais-') ||
      t.url.includes('.run.app') ||
      t.url.includes('localhost:')
    ));

    if (ascendTab && ascendTab.id) {
      if (chrome.scripting && typeof chrome.scripting.executeScript === 'function') {
        chrome.scripting.executeScript({
          target: { tabId: ascendTab.id },
          world: 'MAIN',
          func: () => {
            const datasetVal = document.documentElement ? document.documentElement.dataset.ascendSession : null;
            return datasetVal || localStorage.getItem('ascend_auth_session');
          }
        }, (results) => {
          if (results && results[0] && results[0].result) {
            try {
              const res = results[0].result;
              const session = typeof res === 'string' ? JSON.parse(res) : res;
              chrome.storage.local.set({ ascendSession: session }, () => {
                onAuthenticated(session);
              });
            } catch (parseErr) {
              console.warn("[AuthManager] Malformed session JSON in tab storage:", parseErr);
              if (openIfNotPresent) {
                chrome.tabs.create({ url: `${APP_BASE_URL}/#login` });
              } else {
                onUnauthenticated();
              }
            }
          } else {
            if (openIfNotPresent) {
              chrome.tabs.create({ url: `${APP_BASE_URL}/#login` });
            } else {
              onUnauthenticated();
            }
          }
        });
      } else {
        if (openIfNotPresent) {
          chrome.tabs.create({ url: `${APP_BASE_URL}/#login` });
        } else {
          onUnauthenticated();
        }
      }
    } else {
      if (openIfNotPresent) {
        chrome.tabs.create({ url: `${APP_BASE_URL}/#login` });
      } else {
        onUnauthenticated();
      }
    }
  } catch (err) {
    console.warn("[AuthManager] Session sync error:", err);
    if (openIfNotPresent) {
      chrome.tabs.create({ url: `${APP_BASE_URL}/#login` });
    } else {
      onUnauthenticated();
    }
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
