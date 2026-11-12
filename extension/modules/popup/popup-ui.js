/**
 * @fileoverview Popup UI View Manager for Ascend ATS Extension.
 * Handles DOM view switches, access denied banners, role tab selection, and deep links.
 * NASA JPL Rule 4 & Rule 6: Compact functions and minimal local data scope.
 */

import { APP_BASE_URL } from './constants.js';
import { renderProfileCard } from './readiness-radar.js';

/**
 * Renders the logged-out authentication gate view.
 */
export function renderLoggedOut() {
  const loggedOutView = document.getElementById('view-logged-out');
  const authView = document.getElementById('view-authenticated');
  const signoutBtn = document.getElementById('btn-signout');
  const connStatus = document.getElementById('conn-status');
  const connPill = document.getElementById('conn-pill');

  if (loggedOutView) loggedOutView.style.display = 'block';
  if (authView) authView.style.display = 'none';
  if (signoutBtn) signoutBtn.style.display = 'none';
  if (connStatus) connStatus.innerText = 'Sign In Required';
  if (connPill) {
    connPill.style.background = '#fef2f2';
    connPill.style.color = '#dc2626';
  }
}

/**
 * Renders the authenticated workspace view, updates role locks, and refreshes the profile card.
 *
 * @param {Object} session - Authenticated session payload.
 * @param {'seeker'|'recruiter'|'admin'} currentRole - Active role space.
 * @returns {'seeker'|'recruiter'|'admin'} The resolved initial role for this user.
 */
export function renderAuthenticated(session, currentRole) {
  const loggedOutView = document.getElementById('view-logged-out');
  const authView = document.getElementById('view-authenticated');
  const signoutBtn = document.getElementById('btn-signout');
  const connStatus = document.getElementById('conn-status');
  const connPill = document.getElementById('conn-pill');

  if (loggedOutView) loggedOutView.style.display = 'none';
  if (authView) authView.style.display = 'block';
  if (signoutBtn) signoutBtn.style.display = 'block';
  if (connStatus) connStatus.innerText = 'Verified';
  if (connPill) {
    connPill.style.background = '#ecfdf5';
    connPill.style.color = '#059669';
  }

  // Update profile card and checks
  renderProfileCard(session, currentRole);

  const isMasterAdmin = Boolean(
    session.isAdmin || session.email === 'Chris.Barnes.2000@me.com'
  );
  const isRecruiter = Boolean(
    session.accountType === 'company' ||
    session.accountType === 'recruiter' ||
    session.accountType === 'staffingFirm'
  );

  const lockRecruiter = document.getElementById('lock-recruiter');
  const lockAdmin = document.getElementById('lock-admin');

  let resolvedRole = 'seeker';
  if (isMasterAdmin) {
    if (lockRecruiter) lockRecruiter.style.display = 'none';
    if (lockAdmin) lockAdmin.style.display = 'none';
    resolvedRole = 'admin';
  } else if (isRecruiter) {
    if (lockRecruiter) lockRecruiter.style.display = 'none';
    if (lockAdmin) lockAdmin.style.display = 'inline';
    resolvedRole = 'recruiter';
  } else {
    if (lockRecruiter) lockRecruiter.style.display = 'inline';
    if (lockAdmin) lockAdmin.style.display = 'inline';
    resolvedRole = 'seeker';
  }

  setRole(resolvedRole);
  return resolvedRole;
}

/**
 * Displays the access denied alert box for unauthorized role switches.
 *
 * @param {'recruiter'|'admin'} role - Role that was denied.
 */
export function showAccessDenied(role) {
  const box = document.getElementById('access-denied-box');
  const title = document.getElementById('access-denied-title');
  const desc = document.getElementById('access-denied-desc');
  const actionBtn = document.getElementById('access-denied-btn');

  if (!box || !title || !desc || !actionBtn) return;

  box.classList.add('active');

  if (role === 'recruiter') {
    title.innerHTML = '<span>🔒 Recruiter Privilege Required</span>';
    desc.innerText = 'Your account is verified as a Job Seeker. Requisition import, sourcing engines, and partner pipelines require an authorized Recruiter or Staffing Firm account.';
    actionBtn.innerText = 'Request Firm Access (#partner-request)';
    actionBtn.onclick = (e) => {
      e.preventDefault();
      openAppHash('#partner-request');
    };
  } else if (role === 'admin') {
    title.innerHTML = '<span>🔒 Platform Architect Required</span>';
    desc.innerText = 'Administrative panels, platform seeders, and telemetry diagnostics are restricted exclusively to master platform architects (Chris.Barnes.2000@me.com). Candidate and recruiter accounts cannot access administrative diagnostics.';
    actionBtn.innerText = 'Open Legal & Privacy Center';
    actionBtn.onclick = (e) => {
      e.preventDefault();
      openAppHash('#legal');
    };
  }
}

/**
 * Hides the access denied warning banner.
 */
export function hideAccessDenied() {
  const box = document.getElementById('access-denied-box');
  if (box) box.classList.remove('active');
}

/**
 * Activates a specific role view and synchronizes role navigation tabs.
 *
 * @param {'seeker'|'recruiter'|'admin'} role - Target role to activate.
 */
export function setRole(role) {
  // Update role tab buttons
  const tabs = document.querySelectorAll('.role-tab');
  tabs.forEach(tab => {
    tab.classList.toggle('active', tab.getAttribute('data-role') === role);
  });

  // Toggle view visibility
  const viewSeeker = document.getElementById('view-seeker');
  const viewRecruiter = document.getElementById('view-recruiter');
  const viewAdmin = document.getElementById('view-admin');

  if (viewSeeker) viewSeeker.style.display = role === 'seeker' ? 'block' : 'none';
  if (viewRecruiter) viewRecruiter.style.display = role === 'recruiter' ? 'block' : 'none';
  if (viewAdmin) viewAdmin.style.display = role === 'admin' ? 'block' : 'none';
}

/**
 * Opens a designated URL path or hash fragment within the Ascend ATS web application.
 *
 * @param {string} hash - Route fragment (e.g. '#dashboard', '#analytics', '#admin').
 */
export function openAppHash(hash) {
  const cleanHash = hash ? (hash.startsWith('/') ? hash : `/${hash}`) : '';
  chrome.tabs.create({ url: `${APP_BASE_URL}${cleanHash}` });
}

/**
 * Binds click events to all quick navigation buttons and shortcuts in the popup workspace.
 */
export function bindNavigationLinks() {
  const routes = [
    ['open-web-app', ''],
    ['link-apps', '#dashboard'],
    ['link-analytics', '#analytics'],
    ['link-profile', '#edit-profile'],
    ['link-rec-dash', '#dashboard'],
    ['link-rec-sourcing', '#sourcing'],
    ['link-rec-partner', '#affiliates'],
    ['link-admin-panel', '#admin'],
    ['admin-panel-btn', '#admin'],
    ['link-admin-companies', '#company-management'],
    ['link-admin-invites', '#admin']
  ];
  routes.forEach(([id, hash]) => {
    document.getElementById(id)?.addEventListener('click', (e) => {
      e.preventDefault();
      openAppHash(hash);
    });
  });
}
