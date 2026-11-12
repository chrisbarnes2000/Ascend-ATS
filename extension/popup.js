/**
 * @fileoverview Main orchestrator for Ascend ATS Browser Extension Popup.
 * NASA JPL Rule 1 & Rule 4: Compact function length (< 60 lines) and deterministic wiring.
 */

import { canAccessRole, trySyncSessionFromTabs, signOutSession } from './modules/popup/auth-manager.js';
import { initPromptMatrix } from './modules/popup/prompt-matrix-controller.js';
import { evaluateActiveTabFit } from './modules/popup/fit-evaluator.js';
import { runAdminDiagnostics } from './modules/popup/admin-diagnostics.js';
import { triggerTabIngest } from './modules/popup/ingest-controller.js';
import { 
  renderLoggedOut, 
  renderAuthenticated, 
  showAccessDenied, 
  hideAccessDenied, 
  setRole, 
  openAppHash,
  bindNavigationLinks
} from './modules/popup/popup-ui.js';

let currentSession = null;
let currentRole = 'seeker';
let currentPromptVersion = 'v2';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Prompt Matrix
  initPromptMatrix((ver) => { currentPromptVersion = ver; });

  // 2. Initial Authentication State Check
  chrome.storage.local.get(['ascendSession'], async (res) => {
    if (res && res.ascendSession) {
      currentSession = res.ascendSession;
      currentRole = renderAuthenticated(currentSession, currentRole);
    } else {
      await trySyncSessionFromTabs(false, (session) => {
        currentSession = session;
        currentRole = renderAuthenticated(session, currentRole);
      }, renderLoggedOut);
    }
  });

  // 3. Auth Gate Listeners
  document.getElementById('btn-login-gate')?.addEventListener('click', () => {
    trySyncSessionFromTabs(true, (session) => {
      currentSession = session;
      currentRole = renderAuthenticated(session, currentRole);
    }, renderLoggedOut);
  });
  document.getElementById('btn-signup-gate')?.addEventListener('click', () => openAppHash('#signup'));
  document.getElementById('btn-signout')?.addEventListener('click', () => {
    signOutSession(() => {
      currentSession = null;
      renderLoggedOut();
    });
  });

  // 4. Role Navigation with RBAC Guards
  document.querySelectorAll('.role-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-role');
      hideAccessDenied();
      if (!canAccessRole(currentSession, target)) {
        showAccessDenied(target);
      } else {
        currentRole = target;
        setRole(target);
      }
    });
  });

  // 5. Ingestion Actions
  const onIngestSuccess = () => window.close();
  const onIngestError = (msg) => alert(msg);
  document.getElementById('seeker-import-btn')?.addEventListener('click', () => {
    triggerTabIngest(false, currentSession, currentPromptVersion, currentRole, onIngestSuccess, onIngestError);
  });
  document.getElementById('recruiter-import-btn')?.addEventListener('click', () => {
    if (!canAccessRole(currentSession, 'recruiter')) return showAccessDenied('recruiter');
    triggerTabIngest(true, currentSession, currentPromptVersion, currentRole, onIngestSuccess, onIngestError);
  });

  // 6. Active Tab Fit, Admin Diagnostics & Navigation Links
  document.getElementById('seeker-assess-btn')?.addEventListener('click', evaluateActiveTabFit);
  document.getElementById('admin-diag-btn')?.addEventListener('click', () => {
    if (!canAccessRole(currentSession, 'admin')) return showAccessDenied('admin');
    runAdminDiagnostics(currentSession);
  });
  bindNavigationLinks();
});
